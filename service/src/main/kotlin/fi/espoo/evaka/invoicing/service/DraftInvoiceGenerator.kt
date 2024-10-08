// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.invoicing.service

import fi.espoo.evaka.absence.AbsenceType
import fi.espoo.evaka.invoicing.domain.ChildWithDateOfBirth
import fi.espoo.evaka.invoicing.domain.FeeAlterationType
import fi.espoo.evaka.invoicing.domain.FeeDecision
import fi.espoo.evaka.invoicing.domain.FeeDecisionChild
import fi.espoo.evaka.invoicing.domain.FeeThresholds
import fi.espoo.evaka.invoicing.domain.Invoice
import fi.espoo.evaka.invoicing.domain.InvoiceRow
import fi.espoo.evaka.invoicing.domain.InvoiceStatus
import fi.espoo.evaka.invoicing.domain.calculateMaxFee
import fi.espoo.evaka.invoicing.domain.feeAlterationEffect
import fi.espoo.evaka.invoicing.domain.invoiceRowTotal
import fi.espoo.evaka.placement.PlacementType
import fi.espoo.evaka.serviceneed.ServiceNeedOption
import fi.espoo.evaka.shared.AreaId
import fi.espoo.evaka.shared.ChildId
import fi.espoo.evaka.shared.DaycareId
import fi.espoo.evaka.shared.FeatureConfig
import fi.espoo.evaka.shared.InvoiceId
import fi.espoo.evaka.shared.InvoiceRowId
import fi.espoo.evaka.shared.PersonId
import fi.espoo.evaka.shared.Tracing
import fi.espoo.evaka.shared.data.DateSet
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.FiniteDateRange
import fi.espoo.evaka.shared.domain.mergePeriods
import fi.espoo.evaka.shared.domain.orMax
import fi.espoo.evaka.shared.noopTracer
import fi.espoo.evaka.shared.utils.memoize
import fi.espoo.evaka.shared.withSpan
import fi.espoo.evaka.shared.withValue
import io.opentelemetry.api.trace.Tracer
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.Month
import java.time.temporal.ChronoUnit
import java.util.UUID
import org.springframework.stereotype.Component

enum class InvoiceGenerationLogic {
    Default,
    Free,
}

interface InvoiceGenerationLogicChooser {
    fun logicForMonth(
        tx: Database.Read,
        year: Int,
        month: Month,
        childId: ChildId,
    ): InvoiceGenerationLogic
}

object DefaultInvoiceGenerationLogic : InvoiceGenerationLogicChooser {
    override fun logicForMonth(
        tx: Database.Read,
        year: Int,
        month: Month,
        childId: ChildId,
    ): InvoiceGenerationLogic = InvoiceGenerationLogic.Default
}

@Component
class DraftInvoiceGenerator(
    private val productProvider: InvoiceProductProvider,
    private val featureConfig: FeatureConfig,
    private val invoiceGenerationLogicChooser: InvoiceGenerationLogicChooser,
    private val tracer: Tracer = noopTracer(),
) {
    fun generateDraftInvoices(
        tx: Database.Read,
        data: InvoiceGenerator.InvoiceCalculationData,
    ): List<Invoice> {
        val absencesByChild = data.absences.groupBy { absence -> absence.childId }
        val headsOfFamily = data.decisions.keys + data.temporaryPlacements.keys
        return headsOfFamily.mapNotNull { headOfFamilyId ->
            try {
                val headOfFamilyDecisions = data.decisions[headOfFamilyId] ?: listOf()
                val feeDecisionPlacements =
                    headOfFamilyDecisions.flatMap { decision ->
                        decision.children.flatMap { child ->
                            data.permanentPlacements[child.child.id] ?: listOf()
                        }
                    }

                tracer.withSpan(
                    "generateDraftInvoice",
                    Tracing.headOfFamilyId withValue headOfFamilyId,
                ) {
                    generateDraftInvoice(
                        tx,
                        headOfFamilyId,
                        data.codebtors[headOfFamilyId],
                        headOfFamilyDecisions,
                        feeDecisionPlacements +
                            (data.temporaryPlacements[headOfFamilyId] ?: listOf()),
                        data.period,
                        data.areaIds,
                        data.businessDays,
                        data.feeThresholds,
                        getChildAbsences =
                            memoize { child: ChildId ->
                                (absencesByChild[child] ?: emptyList()).associateBy(
                                    { it.date },
                                    { it.absenceType },
                                )
                            },
                        getChildOperationalDays = { childId ->
                            data.operationalDaysByChild[childId] ?: DateSet.empty()
                        },
                        isFreeJulyChild = data.freeChildren::contains,
                        getDefaultServiceNeedOption = data.defaultServiceNeedOptions::get,
                    )
                }
            } catch (e: Exception) {
                error("Failed to generate invoice for head of family $headOfFamilyId: $e")
            }
        }
    }

    private data class InvoiceRowStub(
        val child: ChildWithDateOfBirth,
        val placement: PlacementStub,
        val priceBeforeFeeAlterations: Int,
        val feeAlterations: List<Pair<FeeAlterationType, Int>>,
        val finalPrice: Int,
        val contractDaysPerMonth: Int?,
    )

    private enum class FullMonthAbsenceType {
        SICK_LEAVE_FULL_MONTH,
        ABSENCE_FULL_MONTH,
        SICK_LEAVE_11,
        NOTHING,
    }

    private fun generateDraftInvoice(
        tx: Database.Read,
        headOfFamily: PersonId,
        codebtor: PersonId?,
        decisions: List<FeeDecision>,
        placements: List<Pair<FiniteDateRange, PlacementStub>>,
        invoicePeriod: FiniteDateRange,
        areaIds: Map<DaycareId, AreaId>,
        businessDays: DateSet,
        feeThresholds: FeeThresholds,
        getChildAbsences: (child: ChildId) -> Map<LocalDate, AbsenceType>,
        getChildOperationalDays: (child: ChildId) -> DateSet,
        isFreeJulyChild: (child: ChildId) -> Boolean,
        getDefaultServiceNeedOption: (placementType: PlacementType) -> ServiceNeedOption?,
    ): Invoice? {
        val businessDayCount = businessDays.ranges().map { it.durationInDays() }.sum().toInt()

        val feeDecisionRangesByChild =
            decisions
                .asSequence()
                .flatMap { decision ->
                    decision.children.asSequence().map {
                        it.child.id to
                            decision.validDuring.asFiniteDateRange(defaultEnd = LocalDate.MAX)
                    }
                }
                .groupBy({ it.first }, { it.second })
                .mapValues { DateSet.of(it.value) }

        val getChildFullMonthAbsence = memoize { child: ChildId ->
            val childOperationalDays =
                getChildOperationalDays(child)
                    .intersection(feeDecisionRangesByChild[child] ?: DateSet.empty())
                    .ranges()
                    .flatMap { it.dates() }
                    .toSet()
            getFullMonthAbsence(
                childOperationalDays,
                getAbsence = { date -> getChildAbsences(child)[date] },
            )
        }

        val getInvoiceMaxFee: (ChildId, Boolean) -> Int = { childId, capMaxFeeAtDefault ->
            val childDecisions =
                decisions.mapNotNull { decision ->
                    val childDecisionPart = decision.children.find { it.child.id == childId }
                    val dateRange = invoicePeriod.intersection(decision.validDuring)
                    if (dateRange != null && childDecisionPart != null) {
                        dateRange to childDecisionPart
                    } else {
                        null
                    }
                }

            val getDecisionPartMaxFee: (FeeDecisionChild) -> Int = { part ->
                val maxFeeBeforeFeeAlterations = calculateMaxFee(part.baseFee, part.siblingDiscount)
                part.feeAlterations.fold(maxFeeBeforeFeeAlterations) { currentFee, feeAlteration ->
                    currentFee +
                        feeAlterationEffect(
                            currentFee,
                            feeAlteration.type,
                            feeAlteration.amount,
                            feeAlteration.isAbsolute,
                        )
                }
            }
            val getDefaultMaxFee: (PlacementType, Int) -> Int = { placementType, discountedFee ->
                val feeCoefficient =
                    getDefaultServiceNeedOption(placementType)?.feeCoefficient
                        ?: throw Exception(
                            "No default service need option found for placement type $placementType"
                        )
                (feeCoefficient * BigDecimal(discountedFee)).toInt()
            }

            val childDecisionMaxFees =
                childDecisions.map { (dateRange, decisionPart) ->
                    val decisionPartMaxFee = getDecisionPartMaxFee(decisionPart)
                    dateRange to
                        minOf(
                            decisionPartMaxFee,
                            if (capMaxFeeAtDefault) {
                                getDefaultMaxFee(decisionPart.placement.type, decisionPartMaxFee)
                            } else Int.MAX_VALUE,
                        )
                }

            if (featureConfig.useContractDaysAsDailyFeeDivisor) {
                childDecisionMaxFees.maxOf { (_, maxFee) -> maxFee }
            } else {
                childDecisionMaxFees
                    .map { (dateRange, maxFee) ->
                        val daysInRange =
                            businessDays
                                .intersectRanges(dateRange)
                                .map { it.durationInDays() }
                                .sum()
                        (BigDecimal(maxFee) * BigDecimal(daysInRange)).divide(
                            BigDecimal(businessDayCount),
                            2,
                            RoundingMode.HALF_UP,
                        )
                    }
                    .fold(BigDecimal.ZERO) { sum, maxFee -> sum + maxFee }
                    .toInt()
            }
        }

        val rowStubs =
            placements
                .groupBy { it.second.child }
                .asSequence()
                .sortedByDescending { (child) -> child.dateOfBirth }
                .flatMapIndexed { index, (child, placements) ->
                    placements.flatMap { (placementDateRange, placement) ->
                        val relevantPeriod =
                            FiniteDateRange(
                                maxOf(invoicePeriod.start, placementDateRange.start),
                                minOf(orMax(invoicePeriod.end), orMax(placementDateRange.end)),
                            )
                        val periodDecisions =
                            decisions.filter { placementDateRange.overlaps(it.validDuring) }

                        when (placement.type) {
                            PlacementType.TEMPORARY_DAYCARE,
                            PlacementType.TEMPORARY_DAYCARE_PART_DAY -> {
                                val partDay =
                                    placement.type == PlacementType.TEMPORARY_DAYCARE_PART_DAY
                                val fee =
                                    feeThresholds.calculatePriceForTemporary(partDay, index + 1)
                                listOf(
                                    relevantPeriod to
                                        InvoiceRowStub(child, placement, fee, listOf(), fee, null)
                                )
                            }
                            else ->
                                periodDecisions
                                    .mapNotNull { decision ->
                                        decision.children
                                            .find { part -> part.child == child }
                                            ?.let { decision.validDuring to it }
                                    }
                                    .filterNot { (_, part) -> isFreeJulyChild(part.child.id) }
                                    .map { (decisionPeriod, part) ->
                                        FiniteDateRange(
                                            maxOf(relevantPeriod.start, decisionPeriod.start),
                                            minOf(
                                                orMax(relevantPeriod.end),
                                                orMax(decisionPeriod.end),
                                            ),
                                        ) to
                                            InvoiceRowStub(
                                                ChildWithDateOfBirth(
                                                    part.child.id,
                                                    part.child.dateOfBirth,
                                                ),
                                                PlacementStub(
                                                    part.child,
                                                    part.placement.unitId,
                                                    part.placement.type,
                                                ),
                                                part.fee,
                                                part.feeAlterations.map { feeAlteration ->
                                                    Pair(feeAlteration.type, feeAlteration.effect)
                                                },
                                                part.finalFee,
                                                part.serviceNeed.contractDaysPerMonth,
                                            )
                                    }
                        }
                    }
                }

        val rows =
            rowStubs
                .groupBy { (_, stub) -> stub.child }
                .flatMap { (child, childStubs) ->
                    val separatePeriods =
                        mergePeriods(childStubs.map { it.first.asDateRange() to it.second }).map {
                            it.first.asFiniteDateRange(defaultEnd = invoicePeriod.end) to it.second
                        }

                    val logic =
                        invoiceGenerationLogicChooser.logicForMonth(
                            tx,
                            invoicePeriod.start.year,
                            invoicePeriod.start.month,
                            child.id,
                        )
                    if (logic == InvoiceGenerationLogic.Free) return@flatMap listOf()

                    // In cities that use contract days it is not allowed to change service needs
                    // during middle of the month, so picking contractDaysPerMonth from the first
                    // one is safe
                    val contractDaysPerMonth =
                        separatePeriods.first().second.contractDaysPerMonth.takeIf {
                            featureConfig.useContractDaysAsDailyFeeDivisor
                        }

                    val dailyFeeDivisor =
                        contractDaysPerMonth
                            ?: featureConfig.dailyFeeDivisorOperationalDaysOverride
                            ?: businessDayCount

                    val childOperationalDays =
                        getChildOperationalDays(child.id).ranges().flatMap { it.dates() }.toSet()

                    val businessDaysWithoutDecision =
                        businessDays - (feeDecisionRangesByChild[child.id] ?: DateSet.empty())

                    val attendanceDates =
                        getAttendanceDates(
                            invoicePeriod,
                            childOperationalDays,
                            contractDaysPerMonth,
                            isPartialMonthChild = businessDaysWithoutDecision.isNotEmpty(),
                            hasPlannedAbsence = { date ->
                                getChildAbsences(child.id)[date] == AbsenceType.PLANNED_ABSENCE
                            },
                        )

                    val relevantAbsences =
                        getChildAbsences(child.id).filter { childOperationalDays.contains(it.key) }

                    separatePeriods
                        .filter { (_, rowStub) -> rowStub.finalPrice != 0 }
                        .fold(listOf<InvoiceRow>()) { accumulatedRows, (period, rowStub) ->
                            accumulatedRows +
                                toInvoiceRows(
                                    accumulatedRows,
                                    period,
                                    rowStub,
                                    dailyFeeDivisor,
                                    numRelevantOperationalDays =
                                        minOf(
                                            contractDaysPerMonth ?: businessDayCount,
                                            dailyFeeDivisor,
                                        ),
                                    attendanceDates,
                                    relevantAbsences,
                                    getChildFullMonthAbsence(child.id),
                                    getInvoiceMaxFee,
                                )
                        }
                }
                .let { rows -> applyRoundingRows(rows, decisions, invoicePeriod) }
                .filter { row -> row.price != 0 }

        if (rows.isEmpty()) return null

        val areaId =
            rowStubs
                .maxByOrNull { (_, stub) -> stub.child.dateOfBirth }!!
                .let { (_, stub) ->
                    areaIds[stub.placement.unit]
                        ?: error("Couldn't find areaId for daycare (${stub.placement.unit})")
                }

        return Invoice(
            id = InvoiceId(UUID.randomUUID()),
            status = InvoiceStatus.DRAFT,
            periodStart = invoicePeriod.start,
            periodEnd = invoicePeriod.end,
            areaId = areaId,
            headOfFamily = headOfFamily,
            codebtor = codebtor,
            rows = rows,
        )
    }

    private fun getFullMonthAbsence(
        operationalDays: Set<LocalDate>,
        getAbsence: (date: LocalDate) -> AbsenceType?,
    ): FullMonthAbsenceType {
        val allSickLeaves =
            operationalDays.all { date -> getAbsence(date) == AbsenceType.SICKLEAVE }
        val atLeastOneSickLeave =
            operationalDays.any { date -> getAbsence(date) == AbsenceType.SICKLEAVE }
        val allSickLeavesOrPlannedAbsences =
            operationalDays.all { date ->
                getAbsence(date) == AbsenceType.SICKLEAVE ||
                    getAbsence(date) == AbsenceType.PLANNED_ABSENCE
            }
        val atLeast11SickLeaves =
            operationalDays.count { date -> getAbsence(date) == AbsenceType.SICKLEAVE } >= 11
        val allAbsences = operationalDays.all { date -> getAbsence(date) != null }

        return if (allSickLeaves) {
            FullMonthAbsenceType.SICK_LEAVE_FULL_MONTH
        } else if (
            featureConfig.freeSickLeaveOnContractDays &&
                atLeastOneSickLeave &&
                allSickLeavesOrPlannedAbsences
        ) {
            // freeSickLeaveOnContractDays: The month becomes free if it has at least one
            // sick leave, and a sick leave or planned absence on all days
            FullMonthAbsenceType.SICK_LEAVE_FULL_MONTH
        } else if (atLeast11SickLeaves) {
            FullMonthAbsenceType.SICK_LEAVE_11
        } else if (allAbsences) {
            FullMonthAbsenceType.ABSENCE_FULL_MONTH
        } else {
            FullMonthAbsenceType.NOTHING
        }
    }

    private fun getAttendanceDates(
        period: FiniteDateRange,
        childOperationalDays: Set<LocalDate>,
        contractDaysPerMonth: Int?,
        isPartialMonthChild: Boolean,
        hasPlannedAbsence: (date: LocalDate) -> Boolean,
    ): List<LocalDate> {
        val attendanceDates =
            operationalDatesByWeek(period, childOperationalDays).flatMap { weekOperationalDates ->
                if (contractDaysPerMonth != null) {
                    // Use real attendance dates (with no planned absences) for contract day
                    // children
                    weekOperationalDates.filterNot(hasPlannedAbsence)
                } else {
                    // Take at most 5 days per week (for round-the-clock units)
                    weekOperationalDates.take(5)
                }
            }

        // If this is a full month for a contract day child (not in partialMonthChildren), make sure
        // that there's no less than `contractDaysPerMonth` days even if they have more
        // planned absences than they should
        return if (
            contractDaysPerMonth != null &&
                !isPartialMonthChild &&
                attendanceDates.size < contractDaysPerMonth
        ) {
            val extraDatesToAdd = contractDaysPerMonth - attendanceDates.size
            val operationalDaysWithoutAttendance =
                childOperationalDays.filter { date -> !attendanceDates.contains(date) }.sorted()

            (attendanceDates + operationalDaysWithoutAttendance.take(extraDatesToAdd)).sorted()
        } else {
            attendanceDates
        }
    }

    private fun operationalDatesByWeek(
        period: FiniteDateRange,
        operationalDays: Set<LocalDate>,
    ): List<List<LocalDate>> {
        return period
            .dates()
            .fold<LocalDate, List<List<LocalDate>>>(listOf()) { weeks, date ->
                if (weeks.isEmpty() || date.dayOfWeek == DayOfWeek.MONDAY) {
                    weeks.plusElement(listOf(date))
                } else {
                    weeks.dropLast(1).plusElement(weeks.last() + date)
                }
            }
            .map { week -> week.filter { date -> operationalDays.contains(date) } }
    }

    private fun toInvoiceRows(
        accumulatedRows: List<InvoiceRow>,
        period: FiniteDateRange,
        invoiceRowStub: InvoiceRowStub,
        dailyFeeDivisor: Int,
        numRelevantOperationalDays: Int,
        attendanceDates: List<LocalDate>,
        absences: Map<LocalDate, AbsenceType>,
        fullMonthAbsenceType: FullMonthAbsenceType,
        getInvoiceMaxFee: (ChildId, Boolean) -> Int,
    ): List<InvoiceRow> {
        val refundAbsenceDates =
            invoiceRowStub.placement.type != PlacementType.TEMPORARY_DAYCARE_PART_DAY ||
                featureConfig.temporaryDaycarePartDayAbsenceGivesADailyRefund
        return when (invoiceRowStub.placement.type) {
            PlacementType.TEMPORARY_DAYCARE,
            PlacementType.TEMPORARY_DAYCARE_PART_DAY ->
                toTemporaryPlacementInvoiceRows(
                    period,
                    invoiceRowStub.child,
                    invoiceRowStub.placement.type,
                    invoiceRowStub.priceBeforeFeeAlterations,
                    invoiceRowStub.placement.unit,
                    dailyFeeDivisor,
                    attendanceDates,
                    isDateRefunded =
                        if (refundAbsenceDates) { date -> absences.containsKey(date) }
                        else { _ -> false },
                )
            else ->
                toPermanentPlacementInvoiceRows(
                    accumulatedRows,
                    period,
                    invoiceRowStub.child,
                    invoiceRowStub.placement.type,
                    invoiceRowStub.priceBeforeFeeAlterations,
                    invoiceRowStub.finalPrice,
                    invoiceRowStub.placement.unit,
                    dailyFeeDivisor,
                    invoiceRowStub.contractDaysPerMonth,
                    numRelevantOperationalDays,
                    attendanceDates,
                    invoiceRowStub.feeAlterations,
                    absences,
                    fullMonthAbsenceType,
                    getInvoiceMaxFee,
                )
        }
    }

    private fun calculateDailyPriceForInvoiceRow(price: Int, dailyFeeDivisor: Int): Int =
        BigDecimal(price).divide(BigDecimal(dailyFeeDivisor), 0, RoundingMode.HALF_UP).toInt()

    private fun toTemporaryPlacementInvoiceRows(
        period: FiniteDateRange,
        child: ChildWithDateOfBirth,
        placementType: PlacementType,
        price: Int,
        unitId: DaycareId,
        dailyFeeDivisor: Int,
        attendanceDates: List<LocalDate>,
        isDateRefunded: (date: LocalDate) -> Boolean,
    ): List<InvoiceRow> {
        val amount =
            attendanceDates
                .take(dailyFeeDivisor)
                .filter { date -> period.includes(date) }
                .filterNot { date -> isDateRefunded(date) }
                .size

        return if (amount == 0) {
            listOf()
        } else {
            listOf(
                InvoiceRow(
                    id = InvoiceRowId(UUID.randomUUID()),
                    periodStart = period.start,
                    periodEnd = period.end,
                    child = child.id,
                    amount = amount,
                    unitPrice = price,
                    unitId = unitId,
                    product = productProvider.mapToProduct(placementType),
                    correctionId = null,
                )
            )
        }
    }

    private fun toPermanentPlacementInvoiceRows(
        accumulatedRows: List<InvoiceRow>,
        period: FiniteDateRange,
        child: ChildWithDateOfBirth,
        placementType: PlacementType,
        price: Int,
        finalPrice: Int,
        unitId: DaycareId,
        dailyFeeDivisor: Int,
        contractDaysPerMonth: Int?,
        numRelevantOperationalDays: Int,
        attendanceDates: List<LocalDate>,
        feeAlterations: List<Pair<FeeAlterationType, Int>>,
        absences: Map<LocalDate, AbsenceType>,
        fullMonthAbsenceType: FullMonthAbsenceType,
        getInvoiceMaxFee: (ChildId, Boolean) -> Int,
    ): List<InvoiceRow> {
        // Make sure the number of operational days in a month doesn't exceed `dailyFeeDivisor`.
        //
        // Example: A child has a placement to a round-the-clock unit for the first half and to a
        // normal unit for the second half of the month. The round-the-clock unit has more
        // operational
        // days, so we have to make sure that we don't invoice more than `dailyFeeDivisor` days.
        //
        val periodAttendanceDates =
            attendanceDates.take(dailyFeeDivisor).filter { period.includes(it) }
        if (periodAttendanceDates.isEmpty()) return listOf()

        val isFullMonth = periodAttendanceDates.size == numRelevantOperationalDays

        val product = productProvider.mapToProduct(placementType)
        val (amount, unitPrice) =
            if (isFullMonth) {
                Pair(1, { p: Int -> p })
            } else {
                Pair(
                    periodAttendanceDates.size,
                    { p: Int -> calculateDailyPriceForInvoiceRow(p, dailyFeeDivisor) },
                )
            }

        val initialRows =
            listOf(
                InvoiceRow(
                    id = InvoiceRowId(UUID.randomUUID()),
                    child = child.id,
                    periodStart = period.start,
                    periodEnd = period.end,
                    amount = amount,
                    unitPrice = unitPrice(price),
                    unitId = unitId,
                    product = product,
                    correctionId = null,
                )
            ) +
                feeAlterations.map { (feeAlterationType, feeAlterationEffect) ->
                    InvoiceRow(
                        id = InvoiceRowId(UUID.randomUUID()),
                        periodStart = period.start,
                        periodEnd = period.end,
                        child = child.id,
                        product =
                            productProvider.mapToFeeAlterationProduct(product, feeAlterationType),
                        unitId = unitId,
                        amount = amount,
                        unitPrice = unitPrice(feeAlterationEffect),
                        correctionId = null,
                    )
                }

        val withDailyModifiers =
            initialRows +
                surplusContractDays(
                    accumulatedRows,
                    period,
                    child,
                    finalPrice,
                    initialRows.sumOf { it.price },
                    unitId,
                    contractDaysPerMonth,
                    attendanceDates,
                    absences,
                    fullMonthAbsenceType in
                        listOf(
                            FullMonthAbsenceType.SICK_LEAVE_FULL_MONTH,
                            FullMonthAbsenceType.ABSENCE_FULL_MONTH,
                        ),
                    getInvoiceMaxFee,
                    placementType,
                ) +
                dailyAbsenceRefund(
                    period,
                    initialRows,
                    child,
                    absences,
                    periodAttendanceDates,
                    numRelevantOperationalDays,
                    isFullMonth,
                    dailyFeeDivisor,
                ) { refundProduct, refundAmount, refundUnitPrice ->
                    InvoiceRow(
                        id = InvoiceRowId(UUID.randomUUID()),
                        child = child.id,
                        periodStart = period.start,
                        periodEnd = period.end,
                        amount = refundAmount,
                        unitPrice = refundUnitPrice,
                        unitId = unitId,
                        product = refundProduct,
                        correctionId = null,
                    )
                }
        return withDailyModifiers +
            monthlyAbsenceDiscount(withDailyModifiers, fullMonthAbsenceType) {
                absenceProduct,
                absenceDiscount ->
                InvoiceRow(
                    id = InvoiceRowId(UUID.randomUUID()),
                    child = child.id,
                    periodStart = period.start,
                    periodEnd = period.end,
                    product = absenceProduct,
                    unitId = unitId,
                    amount = amount,
                    unitPrice =
                        BigDecimal(absenceDiscount)
                            .divide(BigDecimal(amount), 0, RoundingMode.HALF_UP)
                            .toInt(),
                    correctionId = null,
                )
            }
    }

    private val plannedAbsenceTypes = setOf(AbsenceType.PLANNED_ABSENCE, AbsenceType.FREE_ABSENCE)

    private fun surplusContractDays(
        accumulatedRows: List<InvoiceRow>,
        period: FiniteDateRange,
        child: ChildWithDateOfBirth,
        monthlyPrice: Int,
        invoiceRowSum: Int,
        unitId: DaycareId,
        contractDaysPerMonth: Int?,
        attendanceDates: List<LocalDate>,
        absences: Map<LocalDate, AbsenceType>,
        isAbsentFullMonth: Boolean,
        getInvoiceMaxFee: (ChildId, Boolean) -> Int,
        placementType: PlacementType,
    ): List<InvoiceRow> {
        if (contractDaysPerMonth == null || isAbsentFullMonth) return listOf()

        fun hasAbsence(date: LocalDate) = date in absences

        val accumulatedInvoiceRowSum = accumulatedRows.sumOf { it.price } + invoiceRowSum
        val attendancesBeforePeriod =
            attendanceDates.filter { it < period.start && !hasAbsence(it) }.size
        val attendancesInPeriod =
            attendanceDates.filter { period.includes(it) && !hasAbsence(it) }.size
        val unplannedAbsenceSurplusDays =
            if (featureConfig.unplannedAbsencesAreContractSurplusDays) {
                absences
                    .asSequence()
                    .filter { !plannedAbsenceTypes.contains(it.value) }
                    .map { it.key }
            } else {
                sequenceOf()
            }
        val (unplannedAbsencesInPeriod, unplannedAbsencesBeforePeriod) =
            unplannedAbsenceSurplusDays
                .filter { it < period.start || period.includes(it) }
                .partition { period.includes(it) }
        val attendanceDays =
            attendancesBeforePeriod +
                attendancesInPeriod +
                unplannedAbsencesBeforePeriod.size +
                unplannedAbsencesInPeriod.size

        return if (contractDaysPerMonth < attendanceDays) {
            val surplusAttendanceDays = attendanceDays - contractDaysPerMonth
            val surplusDailyPrice =
                calculateDailyPriceForInvoiceRow(monthlyPrice, contractDaysPerMonth)
            val totalAddition = surplusAttendanceDays * surplusDailyPrice
            val maxPrice =
                getInvoiceMaxFee(
                    child.id,
                    listOf(PlacementType.PREPARATORY_DAYCARE, PlacementType.PRESCHOOL_DAYCARE)
                        .contains(placementType),
                )

            val (amount, unitPrice) =
                when {
                    // surplus days increase takes invoice row sum above max price threshold
                    accumulatedInvoiceRowSum + totalAddition > maxPrice ->
                        1 to (maxPrice - accumulatedInvoiceRowSum)
                    // total attendances days is over the max contract day surplus threshold
                    (featureConfig.maxContractDaySurplusThreshold ?: Int.MAX_VALUE) <
                        attendanceDays -> 1 to (maxPrice - accumulatedInvoiceRowSum)
                    else -> surplusAttendanceDays to surplusDailyPrice
                }
            // it is possible that the max fee is not over the already accumulated invoice total so
            // this prevents the
            // surplus from being a 0€ row or a discount
            if (unitPrice > 0) {
                listOf(
                    InvoiceRow(
                        id = InvoiceRowId(UUID.randomUUID()),
                        periodStart = period.start,
                        periodEnd = period.end,
                        child = child.id,
                        product = productProvider.contractSurplusDay,
                        unitId = unitId,
                        amount = amount,
                        unitPrice = unitPrice,
                        correctionId = null,
                    )
                )
            } else {
                listOf()
            }
        } else {
            listOf()
        }
    }

    private fun dailyAbsenceRefund(
        period: FiniteDateRange,
        rows: List<InvoiceRow>,
        child: ChildWithDateOfBirth,
        absences: Map<LocalDate, AbsenceType>,
        periodAttendanceDates: List<LocalDate>,
        numRelevantOperationalDays: Int,
        isFullMonth: Boolean,
        dailyFeeDivisor: Int,
        toInvoiceRow: (ProductKey, Int, Int) -> InvoiceRow,
    ): List<InvoiceRow> {
        assert(periodAttendanceDates.size <= dailyFeeDivisor)

        val total = invoiceRowTotal(rows)
        if (total == 0) return listOf()

        val refundedDayCount = getRefundedDays(period, child, absences)
        if (refundedDayCount == 0) return listOf()

        val (amount, unitPrice) =
            if (refundedDayCount >= minOf(dailyFeeDivisor, numRelevantOperationalDays)) {
                1 to -total
            } else {
                refundedDayCount to
                    -calculateDailyPriceForInvoiceRow(
                        total,
                        if (isFullMonth) dailyFeeDivisor else periodAttendanceDates.size,
                    )
            }

        return listOf(toInvoiceRow(productProvider.dailyRefund, amount, unitPrice))
    }

    private fun getRefundedDays(
        period: FiniteDateRange,
        child: ChildWithDateOfBirth,
        absences: Map<LocalDate, AbsenceType>,
    ): Int {
        val forceMajeureDays =
            absences.count { (date, type) ->
                period.includes(date) &&
                    (type == AbsenceType.FORCE_MAJEURE ||
                        (featureConfig.freeAbsenceGivesADailyRefund &&
                            type == AbsenceType.FREE_ABSENCE))
            }

        val parentLeaveDays =
            absences.count { (date, type) ->
                period.includes(date) &&
                    type == AbsenceType.PARENTLEAVE &&
                    ChronoUnit.YEARS.between(child.dateOfBirth, date) < 2
            }

        return forceMajeureDays + parentLeaveDays
    }

    private fun monthlyAbsenceDiscount(
        rows: List<InvoiceRow>,
        fullMonthAbsenceType: FullMonthAbsenceType,
        toInvoiceRow: (ProductKey, Int) -> InvoiceRow,
    ): List<InvoiceRow> {
        val total = invoiceRowTotal(rows)
        if (total == 0) return listOf()

        val halfPrice = { price: Int ->
            BigDecimal(price).divide(BigDecimal(2), 0, RoundingMode.HALF_UP).toInt()
        }

        val (product, totalDiscount) =
            when (fullMonthAbsenceType) {
                FullMonthAbsenceType.SICK_LEAVE_FULL_MONTH ->
                    productProvider.fullMonthSickLeave to -total
                FullMonthAbsenceType.SICK_LEAVE_11 ->
                    productProvider.partMonthSickLeave to -halfPrice(total)
                FullMonthAbsenceType.ABSENCE_FULL_MONTH ->
                    productProvider.fullMonthAbsence to -halfPrice(total)
                FullMonthAbsenceType.NOTHING -> return listOf()
            }

        return listOf(toInvoiceRow(product, totalDiscount))
    }

    /*
    An extra invoice row is added for a child in case their invoice row sum is within 0.5€ of the monthly fee.
    These are typically used only when the child changes placement units and has for accounting reasons their monthly fee
    split into two invoice rows with daily prices. Daily prices are always rounded to whole cents so rounding mismatch
    is inevitable.

    A difference of 0.2€ is chosen because it's a bit over the maximum rounding error, which is 0.005€ * 31 (max amount of days in a month)
    */
    private fun applyRoundingRows(
        invoiceRows: List<InvoiceRow>,
        feeDecisions: List<FeeDecision>,
        invoicePeriod: FiniteDateRange,
    ): List<InvoiceRow> {
        return invoiceRows
            .groupBy { it.child }
            .flatMap { (child, rows) ->
                val uniqueChildFees =
                    feeDecisions
                        .flatMap { it.children }
                        .filter { it.child.id == child }
                        .map { it.finalFee }
                        .distinct()

                val invoiceRowSum = rows.sumOf { it.price }

                val roundingRow =
                    if (uniqueChildFees.size == 1) {
                        val difference = uniqueChildFees.first() - invoiceRowSum

                        if (difference != 0 && -20 < difference && difference < 20) {
                            rows
                                .first()
                                .copy(
                                    id = InvoiceRowId(UUID.randomUUID()),
                                    periodStart = invoicePeriod.start,
                                    periodEnd = invoicePeriod.end,
                                    amount = 1,
                                    unitPrice = difference,
                                )
                        } else {
                            null
                        }
                    } else {
                        null
                    }

                if (roundingRow != null) rows + roundingRow else rows
            }
    }
}
