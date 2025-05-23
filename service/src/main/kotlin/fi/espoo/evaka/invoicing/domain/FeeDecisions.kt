// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.invoicing.domain

import com.fasterxml.jackson.annotation.JsonProperty
import fi.espoo.evaka.ConstList
import fi.espoo.evaka.placement.PlacementType
import fi.espoo.evaka.shared.*
import fi.espoo.evaka.shared.db.DatabaseEnum
import fi.espoo.evaka.shared.domain.DateRange
import fi.espoo.evaka.shared.domain.FiniteDateRange
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import fi.espoo.evaka.shared.domain.europeHelsinki
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.util.*
import kotlin.math.max
import org.jdbi.v3.core.mapper.Nested
import org.jdbi.v3.json.Json

data class FeeDecision(
    override val id: FeeDecisionId,
    @Json val children: List<FeeDecisionChild>,
    override val headOfFamilyId: PersonId,
    override val validDuring: FiniteDateRange,
    val status: FeeDecisionStatus,
    val decisionNumber: Long? = null,
    val decisionType: FeeDecisionType,
    val partnerId: PersonId?,
    @Json val headOfFamilyIncome: DecisionIncome?,
    @Json val partnerIncome: DecisionIncome?,
    val familySize: Int,
    @Json val feeThresholds: FeeDecisionThresholds,
    val difference: Set<FeeDecisionDifference>,
    val documentKey: String? = null,
    val approvedById: EmployeeId? = null,
    val approvedAt: HelsinkiDateTime? = null,
    val decisionHandlerId: EmployeeId? = null,
    val sentAt: HelsinkiDateTime? = null,
    override val created: HelsinkiDateTime = HelsinkiDateTime.now(),
) : FinanceDecision<FeeDecision> {
    val totalFee
        get() = children.fold(0) { sum, child -> sum + child.finalFee }

    override val validFrom: LocalDate = validDuring.start
    override val validTo: LocalDate = validDuring.end

    override fun withId(id: UUID) = this.copy(id = FeeDecisionId(id))

    override fun withValidity(period: FiniteDateRange) = this.copy(validDuring = period)

    override fun withCreated(created: HelsinkiDateTime) = this.copy(created = created)

    override fun contentEquals(decision: FeeDecision): Boolean =
        FeeDecisionDifference.getDifference(this, decision).isEmpty()

    override fun overlapsWith(other: FeeDecision): Boolean {
        return this.validDuring.overlaps(other.validDuring) &&
            (
            // Check if any of the adults are on the other decision
            this.headOfFamilyId == other.headOfFamilyId ||
                (this.partnerId != null &&
                    other.partnerId != null &&
                    (this.headOfFamilyId == other.partnerId ||
                        this.partnerId == other.headOfFamilyId ||
                        this.partnerId == other.partnerId)))
    }

    override fun isAnnulled(): Boolean = this.status == FeeDecisionStatus.ANNULLED

    override fun isEmpty(): Boolean = this.children.isEmpty()

    override fun annul() = this.copy(status = FeeDecisionStatus.ANNULLED)
}

data class FeeDecisionChild(
    @Nested("child") val child: ChildWithDateOfBirth,
    @Nested("placement") val placement: FeeDecisionPlacement,
    @Nested("service_need") val serviceNeed: FeeDecisionServiceNeed,
    val baseFee: Int,
    val siblingDiscount: Int,
    val fee: Int,
    @Json val feeAlterations: List<FeeAlterationWithEffect>,
    val finalFee: Int,
    @Json val childIncome: DecisionIncome?,
)

data class FeeDecisionPlacement(val unitId: DaycareId, val type: PlacementType)

data class FeeDecisionServiceNeed(
    val optionId: ServiceNeedOptionId?,
    val feeCoefficient: BigDecimal,
    val contractDaysPerMonth: Int?,
    val descriptionFi: String,
    val descriptionSv: String,
    val missing: Boolean,
)

data class FeeAlterationWithEffect(
    val type: FeeAlterationType,
    val amount: Int,
    @get:JsonProperty("isAbsolute") val isAbsolute: Boolean,
    val effect: Int,
)

enum class FeeDecisionStatus : DatabaseEnum {
    DRAFT,
    IGNORED,
    WAITING_FOR_SENDING,
    WAITING_FOR_MANUAL_SENDING,
    SENT,
    ANNULLED;

    override val sqlType: String = "fee_decision_status"

    companion object {
        /**
         * list of statuses that have an overlap exclusion constraint at the database level and that
         * signal that a decision is in effect
         */
        val effective = arrayOf(SENT, WAITING_FOR_SENDING, WAITING_FOR_MANUAL_SENDING)
    }
}

enum class FeeDecisionType : DatabaseEnum {
    NORMAL,
    RELIEF_REJECTED,
    RELIEF_PARTLY_ACCEPTED,
    RELIEF_ACCEPTED;

    override val sqlType: String = "fee_decision_type"
}

@ConstList("feeDecisionDifferences")
enum class FeeDecisionDifference(val contentEquals: (d1: FeeDecision, d2: FeeDecision) -> Boolean) :
    DatabaseEnum {
    GUARDIANS({ d1, d2 ->
        setOf(d1.headOfFamilyId, d1.partnerId) == setOf(d2.headOfFamilyId, d2.partnerId)
    }),
    CHILDREN({ d1, d2 ->
        d1.children.map { it.child.id }.toSet() == d2.children.map { it.child.id }.toSet()
    }),
    INCOME({ d1, d2 ->
        ((decisionIncomesEqual(d1.headOfFamilyIncome, d2.headOfFamilyIncome) &&
            decisionIncomesEqual(d1.partnerIncome, d2.partnerIncome)) ||
            (decisionIncomesEqual(d1.headOfFamilyIncome, d2.partnerIncome) &&
                decisionIncomesEqual(d1.partnerIncome, d2.headOfFamilyIncome))) &&
            decisionChildrenEquals(d1, d2) { a, b ->
                decisionIncomesEqual(a.childIncome, b.childIncome)
            }
    }),
    PLACEMENT({ d1, d2 -> decisionChildrenEquals(d1, d2) { a, b -> a.placement == b.placement } }),
    SERVICE_NEED({ d1, d2 ->
        decisionChildrenEquals(d1, d2) { a, b ->
            a.serviceNeed.copy(optionId = null) == b.serviceNeed.copy(optionId = null)
        }
    }),
    SIBLING_DISCOUNT({ d1, d2 ->
        decisionChildrenEquals(d1, d2) { a, b -> a.siblingDiscount == b.siblingDiscount }
    }),
    FEE_ALTERATIONS({ d1, d2 ->
        decisionChildrenEquals(d1, d2) { a, b -> a.feeAlterations == b.feeAlterations }
    }),
    FAMILY_SIZE({ d1, d2 -> d1.familySize == d2.familySize }),
    FEE_THRESHOLDS({ d1, d2 -> d1.feeThresholds == d2.feeThresholds });

    override val sqlType: String = "fee_decision_difference"

    companion object {
        fun getDifference(d1: FeeDecision, d2: FeeDecision): Set<FeeDecisionDifference> {
            if (d1.isEmpty() && d2.isEmpty()) {
                return if (GUARDIANS.contentEquals(d1, d2)) emptySet() else setOf(GUARDIANS)
            }
            return entries.filterNot { it.contentEquals(d1, d2) }.toSet()
        }
    }
}

private fun decisionChildrenEquals(
    d1: FeeDecision,
    d2: FeeDecision,
    fn: (FeeDecisionChild, FeeDecisionChild) -> Boolean,
): Boolean {
    return d1.children.all { child1 ->
        // If there's no matching child in the other decision, consider the children equal
        // (if the decisions contain different children, the CHILDREN difference will be set)
        val child2 = d2.children.find { it.child.id == child1.child.id } ?: return true
        fn(child1, child2)
    }
}

data class FeeDecisionDetailed(
    val id: FeeDecisionId,
    @Json val children: List<FeeDecisionChildDetailed>,
    val validDuring: FiniteDateRange,
    val status: FeeDecisionStatus,
    val decisionNumber: Long? = null,
    val decisionType: FeeDecisionType,
    @Nested("head") val headOfFamily: PersonDetailed,
    @Nested("partner") val partner: PersonDetailed?,
    @Json val headOfFamilyIncome: DecisionIncome?,
    @Json val partnerIncome: DecisionIncome?,
    val familySize: Int,
    @Json val feeThresholds: FeeDecisionThresholds,
    val documentKey: String? = null,
    @Nested("approved_by") val approvedBy: EmployeeWithName? = null,
    val approvedAt: HelsinkiDateTime? = null,
    val sentAt: HelsinkiDateTime? = null,
    val financeDecisionHandlerFirstName: String?,
    val financeDecisionHandlerLastName: String?,
    val created: HelsinkiDateTime = HelsinkiDateTime.now(),
    val partnerIsCodebtor: Boolean? = false,
    // True if the document is a legacy document that may contain guardian name and address.
    val documentContainsContactInfo: Boolean,
) {
    val totalFee
        get() = children.fold(0) { sum, part -> sum + part.finalFee }

    val incomeEffect
        get() =
            getTotalIncomeEffect(partner != null, headOfFamilyIncome?.effect, partnerIncome?.effect)

    val totalIncome
        get() =
            getTotalIncome(
                partner != null,
                headOfFamilyIncome?.effect,
                headOfFamilyIncome?.total,
                partnerIncome?.effect,
                partnerIncome?.total,
            )

    val requiresManualSending
        get(): Boolean {
            if (decisionType != FeeDecisionType.NORMAL || headOfFamily.forceManualFeeDecisions) {
                return true
            }

            // Restricted will be sent to allow fast receiving via suomi.fi e-channel.
            if (headOfFamily.restrictedDetailsEnabled) {
                return false
            }

            return headOfFamily.let {
                listOf(it.ssn, it.streetAddress, it.postalCode, it.postOffice).any { item ->
                    item.isNullOrBlank()
                }
            }
        }

    val isRetroactive
        get() =
            isRetroactive(
                this.validDuring.start,
                sentAt?.toLocalDate() ?: LocalDate.now(europeHelsinki),
            )
}

fun isRetroactive(decisionValidFrom: LocalDate, sentAt: LocalDate): Boolean {
    val retroThreshold = sentAt.withDayOfMonth(1)
    return decisionValidFrom.isBefore(retroThreshold)
}

data class FeeDecisionChildDetailed(
    val child: PersonDetailed,
    val placementType: PlacementType,
    val placementUnit: UnitData,
    val serviceNeedOptionId: ServiceNeedOptionId?,
    val serviceNeedFeeCoefficient: BigDecimal,
    val serviceNeedDescriptionFi: String,
    val serviceNeedDescriptionSv: String,
    val serviceNeedMissing: Boolean,
    val baseFee: Int,
    val siblingDiscount: Int,
    val fee: Int,
    val feeAlterations: List<FeeAlterationWithEffect>,
    val finalFee: Int,
    val childIncome: DecisionIncome?,
)

data class FeeDecisionSummary(
    val id: FeeDecisionId,
    @Json val children: List<PersonBasic>,
    val validDuring: FiniteDateRange,
    val status: FeeDecisionStatus,
    val decisionNumber: Long? = null,
    @Nested("head") val headOfFamily: PersonBasic,
    val approvedAt: HelsinkiDateTime? = null,
    val sentAt: HelsinkiDateTime? = null,
    val finalPrice: Int,
    val created: HelsinkiDateTime = HelsinkiDateTime.now(),
    val difference: Set<FeeDecisionDifference>,
) {
    val annullingDecision
        get() = this.children.isEmpty()
}

fun useMaxFee(incomes: List<DecisionIncome?>): Boolean =
    incomes.filterNotNull().let {
        it.size < incomes.size || it.any { income -> income.effect != IncomeEffect.INCOME }
    }

fun calculateBaseFee(
    feeThresholds: FeeThresholds,
    familySize: Int,
    incomes: List<DecisionIncome?>,
): Int {
    check(familySize > 1) { "Family size should not be less than 2" }

    val multiplier = feeThresholds.incomeMultiplier(familySize)

    val feeInCents =
        if (useMaxFee(incomes)) {
            multiplier *
                BigDecimal(
                    feeThresholds.maxIncomeThreshold(familySize) -
                        feeThresholds.minIncomeThreshold(familySize)
                )
        } else {
            val minThreshold = feeThresholds.minIncomeThreshold(familySize)
            val maxThreshold = feeThresholds.maxIncomeThreshold(familySize)
            val totalIncome = incomes.filterNotNull().sumOf { it.total }
            val totalSurplus =
                minOf(maxOf(totalIncome - minThreshold, 0), maxThreshold - minThreshold)
            multiplier * BigDecimal(totalSurplus)
        }

    // round the fee to whole euros, but keep the value in cents
    return roundToEuros(feeInCents).toInt()
}

fun getTotalIncomeEffect(
    hasPartner: Boolean,
    headIncomeEffect: IncomeEffect?,
    partnerIncomeEffect: IncomeEffect?,
): IncomeEffect =
    when {
        headIncomeEffect == IncomeEffect.INCOME &&
            (!hasPartner || partnerIncomeEffect == IncomeEffect.INCOME) -> IncomeEffect.INCOME
        headIncomeEffect == IncomeEffect.MAX_FEE_ACCEPTED ||
            partnerIncomeEffect == IncomeEffect.MAX_FEE_ACCEPTED -> IncomeEffect.MAX_FEE_ACCEPTED
        headIncomeEffect == IncomeEffect.INCOMPLETE ||
            partnerIncomeEffect == IncomeEffect.INCOMPLETE -> IncomeEffect.INCOMPLETE
        else -> IncomeEffect.NOT_AVAILABLE
    }

fun getTotalIncome(
    hasPartner: Boolean,
    headIncomeEffect: IncomeEffect?,
    headIncomeTotal: Int?,
    partnerIncomeEffect: IncomeEffect?,
    partnerIncomeTotal: Int?,
): Int? =
    when {
        headIncomeEffect == IncomeEffect.INCOME &&
            (!hasPartner || partnerIncomeEffect == IncomeEffect.INCOME) ->
            (headIncomeTotal ?: 0) + (partnerIncomeTotal ?: 0)
        else -> null
    }

fun calculateFeeBeforeFeeAlterations(
    baseFee: Int,
    serviceNeedCoefficient: BigDecimal,
    siblingDiscount: SiblingDiscount,
    minFee: Int,
): Int {
    val feeAfterSiblingDiscount =
        siblingDiscount.fee?.let { BigDecimal(it) }
            ?: roundToEuros(BigDecimal(baseFee) * siblingDiscount.multiplier)
    val feeBeforeRounding = roundToEuros(feeAfterSiblingDiscount * serviceNeedCoefficient).toInt()
    return feeBeforeRounding.let { fee ->
        if (fee < minFee) {
            0
        } else {
            fee
        }
    }
}

fun calculateMaxFee(baseFee: Int, siblingDiscount: Int): Int {
    val siblingDiscountMultiplier =
        BigDecimal(100 - siblingDiscount).divide(BigDecimal(100), 10, RoundingMode.HALF_UP)
    return roundToEuros(BigDecimal(baseFee) * siblingDiscountMultiplier).toInt()
}

fun toFeeAlterationsWithEffects(
    fee: Int,
    feeAlterations: List<FeeAlteration>,
): List<FeeAlterationWithEffect> {
    val (_, alterations) =
        feeAlterations.fold(fee to listOf<FeeAlterationWithEffect>()) { pair, feeAlteration ->
            val (currentFee, currentAlterations) = pair
            val effect =
                feeAlterationEffect(
                    currentFee,
                    feeAlteration.type,
                    feeAlteration.amount,
                    feeAlteration.isAbsolute,
                )
            Pair(
                currentFee + effect,
                currentAlterations +
                    FeeAlterationWithEffect(
                        feeAlteration.type,
                        feeAlteration.amount,
                        feeAlteration.isAbsolute,
                        effect,
                    ),
            )
        }
    return alterations
}

fun feeAlterationEffect(fee: Int, type: FeeAlterationType, amount: Int, absolute: Boolean): Int {
    val multiplier =
        when (type) {
            FeeAlterationType.RELIEF,
            FeeAlterationType.DISCOUNT -> -1
            FeeAlterationType.INCREASE -> 1
        }

    val effect =
        if (absolute) {
            val amountInCents = amount * 100
            (multiplier * amountInCents)
        } else {
            val percentageMultiplier =
                BigDecimal(amount).divide(BigDecimal(100), 10, RoundingMode.HALF_UP)
            (BigDecimal(fee) * (BigDecimal(multiplier) * percentageMultiplier))
                .setScale(0, RoundingMode.HALF_UP)
                .toInt()
        }

    // This so that the effect of absolute discounts (eg. -10€) on 0€ fees is 0€ as well
    return max(0, fee + effect) - fee
}

// Current flat increase for children with a parent working at ECHA
const val ECHAIncrease = 93

fun getECHAIncrease(childId: ChildId, period: DateRange) =
    FeeAlteration(
        personId = childId,
        type = FeeAlterationType.INCREASE,
        amount = ECHAIncrease,
        isAbsolute = true,
        notes = "ECHA",
        validFrom = period.start,
        validTo = period.end,
    )
