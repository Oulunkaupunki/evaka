package fi.espoo.evaka.invoicing.service

import fi.espoo.evaka.invoicing.domain.DecisionIncome
import fi.espoo.evaka.invoicing.domain.FeeAlteration
import fi.espoo.evaka.invoicing.domain.FeeThresholds
import fi.espoo.evaka.invoicing.domain.FinanceDecision
import fi.espoo.evaka.placement.PlacementType
import fi.espoo.evaka.serviceneed.ServiceNeedOption
import fi.espoo.evaka.serviceneed.ServiceNeedOptionFee
import fi.espoo.evaka.serviceneed.getServiceNeedOptions
import fi.espoo.evaka.shared.DaycareId
import fi.espoo.evaka.shared.PersonId
import fi.espoo.evaka.shared.ServiceNeedOptionId
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.DateRange
import fi.espoo.evaka.shared.domain.FiniteDateRange
import fi.espoo.evaka.shared.domain.periodsCanMerge
import java.math.BigDecimal

fun <T : FinanceDecision<T>> existsActiveDuplicateThatWillRemainEffective(
    draft: T,
    activeDecisions: List<T>,
    drafts: List<T>,
): Boolean {
    val activeDuplicate =
        activeDecisions.find {
            it.validDuring.contains(draft.validDuring) && it.contentEquals(draft)
        }
            ?: return false

    val nonIdenticalDraftsOverlappingActive =
        drafts.filter {
            it.validDuring.overlaps(activeDuplicate.validDuring) &&
                !it.contentEquals(activeDuplicate)
        }

    val activeValidUntil =
        nonIdenticalDraftsOverlappingActive.minOfOrNull { it.validFrom.minusDays(1) }
            ?: activeDuplicate.validTo

    if (activeValidUntil != null && activeValidUntil < activeDuplicate.validFrom) {
        return false // active decision will be annulled
    }

    val newActiveRange = DateRange(activeDuplicate.validFrom, activeValidUntil)

    return newActiveRange.contains(draft.validDuring)
}

fun <T : FinanceDecision<T>> mergeAdjacentIdenticalDrafts(decisions: List<T>): List<T> {
    return decisions
        .sortedBy { it.validFrom }
        .fold(emptyList()) { acc, next ->
            val prev = acc.lastOrNull()
            if (
                prev != null &&
                    periodsCanMerge(prev.validDuring, next.validDuring) &&
                    prev.contentEquals(next)
            ) {
                acc.dropLast(1) + prev.withValidity(DateRange(prev.validFrom, next.validTo))
            } else {
                acc + next
            }
        }
}

fun <Decision : FinanceDecision<Decision>, Difference> Decision.getDifferencesToPrevious(
    newDrafts: List<Decision>,
    existingActiveDecisions: List<Decision>,
    getDifferences: (decision1: Decision, decision2: Decision) -> Set<Difference>
): Set<Difference> {
    if (this.isEmpty()) {
        return emptySet()
    }

    val draftDifferences =
        newDrafts
            .filter { other ->
                !other.isEmpty() && periodsCanMerge(other.validDuring, this.validDuring)
            }
            .flatMap { other -> getDifferences(other, this) }

    if (draftDifferences.isNotEmpty()) {
        return draftDifferences.toSet()
    }

    val activeDifferences =
        existingActiveDecisions
            .filter { active -> periodsCanMerge(active.validDuring, this.validDuring) }
            .flatMap { active -> getDifferences(active, this) }

    return activeDifferences.toSet()
}

data class PlacementDetails(
    val childId: PersonId,
    override val finiteRange: FiniteDateRange,
    val placementType: PlacementType,
    val unitId: DaycareId,
    val invoicedUnit: Boolean,
    val hasServiceNeed: Boolean,
    val serviceNeedOption: ServiceNeedOption,
) : WithFiniteRange {
    fun displayOnFeeDecision(): Boolean {
        if (!affectsSiblingDiscount()) return false

        if (!invoicedUnit) return false

        if (serviceNeedOption.feeCoefficient.compareTo(BigDecimal.ZERO) == 0) return false

        return true
    }

    fun affectsSiblingDiscount(): Boolean {
        val excludedTypes =
            listOf(
                PlacementType.CLUB,
                PlacementType.TEMPORARY_DAYCARE,
                PlacementType.TEMPORARY_DAYCARE_PART_DAY,
                PlacementType.SCHOOL_SHIFT_CARE
            )
        if (excludedTypes.contains(placementType)) return false

        return true
    }
}

data class PlacementRange(
    val childId: PersonId,
    override val finiteRange: FiniteDateRange,
    val type: PlacementType,
    val unitId: DaycareId,
    val invoicedUnit: Boolean
) : WithFiniteRange

data class ServiceNeedRange(
    val childId: PersonId,
    override val finiteRange: FiniteDateRange,
    val optionId: ServiceNeedOptionId
) : WithFiniteRange

fun getPlacementDetails(
    tx: Database.Read,
    childIds: Set<PersonId>
): Map<PersonId, List<PlacementDetails>> {
    if (childIds.isEmpty()) return emptyMap()

    val serviceNeedOptions = tx.getServiceNeedOptions()

    val placements =
        tx.createQuery(
                """
        SELECT 
            child_id, 
            daterange(pl.start_date, pl.end_date, '[]') as finite_range, 
            pl.type,
            pl.unit_id,
            invoiced_by_municipality as invoiced_unit
        FROM placement pl
        JOIN daycare d ON pl.unit_id = d.id
        WHERE child_id = ANY(:ids)
    """
            )
            .bind("ids", childIds.toTypedArray())
            .mapTo<PlacementRange>()
            .groupBy { it.childId }

    val serviceNeeds =
        tx.createQuery(
                """
        SELECT child_id, daterange(sn.start_date, sn.end_date, '[]') as finite_range, sn.option_id
        FROM service_need sn
        JOIN placement p ON sn.placement_id = p.id
        WHERE child_id = ANY(:ids)
    """
            )
            .bind("ids", childIds.toTypedArray())
            .mapTo<ServiceNeedRange>()
            .groupBy { it.childId }

    val dateRanges =
        buildFiniteDateRanges(
            *placements.flatMap { it.value }.toTypedArray(),
            *serviceNeeds.flatMap { it.value }.toTypedArray()
        )

    return childIds.associateWith { childId ->
        dateRanges.mapNotNull { range ->
            val placement =
                placements[childId]?.firstOrNull { it.range.contains(range) }
                    ?: return@mapNotNull null
            val serviceNeed = serviceNeeds[childId]?.firstOrNull { it.range.contains(range) }
            val serviceNeedOption =
                if (serviceNeed != null) {
                    serviceNeedOptions.find { it.id == serviceNeed.optionId }
                        ?: throw Error("Missing service need option ${serviceNeed.optionId}")
                } else {
                    serviceNeedOptions.find {
                        it.defaultOption && it.validPlacementType == placement.type
                    }
                        ?: throw Error("Missing default service need option for ${placement.type}")
                }
            PlacementDetails(
                childId = childId,
                finiteRange = range,
                placementType = placement.type,
                unitId = placement.unitId,
                invoicedUnit = placement.invoicedUnit,
                hasServiceNeed = serviceNeed != null,
                serviceNeedOption = serviceNeedOption
            )
        }
    }
}

data class IncomeRange(override val range: DateRange, val income: DecisionIncome) : WithRange

data class FeeThresholdsRange(override val range: DateRange, val thresholds: FeeThresholds) :
    WithRange

data class ServiceNeedOptionFeeRange(
    override val range: DateRange,
    val serviceNeedOptionFee: ServiceNeedOptionFee
) : WithRange

data class FeeAlterationRange(override val range: DateRange, val feeAlteration: FeeAlteration) :
    WithRange
