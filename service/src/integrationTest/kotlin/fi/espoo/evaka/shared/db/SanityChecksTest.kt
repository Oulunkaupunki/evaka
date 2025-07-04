// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.shared.db

import fi.espoo.evaka.PureJdbiTest
import fi.espoo.evaka.insertServiceNeedOptions
import fi.espoo.evaka.invoicing.domain.FeeDecisionStatus
import fi.espoo.evaka.placement.PlacementType
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.dev.DevBackupCare
import fi.espoo.evaka.shared.dev.DevCareArea
import fi.espoo.evaka.shared.dev.DevChildAttendance
import fi.espoo.evaka.shared.dev.DevDaycare
import fi.espoo.evaka.shared.dev.DevDaycareGroup
import fi.espoo.evaka.shared.dev.DevDaycareGroupPlacement
import fi.espoo.evaka.shared.dev.DevEmployee
import fi.espoo.evaka.shared.dev.DevFeeDecision
import fi.espoo.evaka.shared.dev.DevFeeDecisionChild
import fi.espoo.evaka.shared.dev.DevPerson
import fi.espoo.evaka.shared.dev.DevPersonType
import fi.espoo.evaka.shared.dev.DevPlacement
import fi.espoo.evaka.shared.dev.DevReservation
import fi.espoo.evaka.shared.dev.DevServiceNeed
import fi.espoo.evaka.shared.dev.insert
import fi.espoo.evaka.shared.domain.FiniteDateRange
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import fi.espoo.evaka.shared.domain.MockEvakaClock
import fi.espoo.evaka.snDaycareFullDay35
import java.time.LocalDate
import java.time.LocalTime
import kotlin.test.Test
import kotlin.test.assertEquals

class SanityChecksTest : PureJdbiTest(resetDbBeforeEach = true) {
    private val today = LocalDate.of(2024, 6, 1)
    private val now = HelsinkiDateTime.of(today, LocalTime.of(3, 45))
    private val mockClock = MockEvakaClock(now)

    @Test
    fun `sanityCheckAttendancesInFuture positive`() {
        val fixture = givenChildInDaycare(today.minusMonths(1), today.plusMonths(1))
        db.transaction {
            it.insert(
                DevChildAttendance(
                    childId = fixture.child.id,
                    unitId = fixture.daycare.id,
                    date = today.plusDays(1),
                    arrived = LocalTime.of(0, 15),
                    departed = null,
                )
            )
        }
        val violations = db.read { it.sanityCheckAttendancesInFuture(mockClock.today()) }
        assertEquals(1, violations.size)
    }

    @Test
    fun `sanityCheckAttendancesInFuture negative`() {
        val fixture = givenChildInDaycare(today.minusMonths(1), today.plusMonths(1))
        db.transaction {
            it.insert(
                DevChildAttendance(
                    childId = fixture.child.id,
                    unitId = fixture.daycare.id,
                    date = today,
                    arrived = LocalTime.of(0, 15),
                    departed = null,
                )
            )
        }
        val violations = db.read { it.sanityCheckAttendancesInFuture(mockClock.today()) }
        assertEquals(0, violations.size)
    }

    @Test
    fun `sanityCheckServiceNeedOutsidePlacement positive`() {
        val employee = DevEmployee()
        val placementStart = today.minusMonths(1)
        val placementEnd = today.plusMonths(1)
        val fixture = givenChildInDaycare(placementStart, placementEnd)
        db.transaction {
            it.insertServiceNeedOptions()
            it.insert(employee)
            it.insert(
                DevServiceNeed(
                    placementId = fixture.placement.id,
                    startDate = placementStart.minusDays(1),
                    endDate = today.minusDays(1),
                    optionId = snDaycareFullDay35.id,
                    confirmedBy = employee.evakaUserId,
                )
            )
            it.insert(
                DevServiceNeed(
                    placementId = fixture.placement.id,
                    startDate = today.plusDays(1),
                    endDate = placementEnd.plusDays(1),
                    optionId = snDaycareFullDay35.id,
                    confirmedBy = employee.evakaUserId,
                )
            )
        }
        val violations = db.read { it.sanityCheckServiceNeedOutsidePlacement() }
        assertEquals(2, violations.size)
    }

    @Test
    fun `sanityCheckServiceNeedOutsidePlacement negative`() {
        val employee = DevEmployee()
        val placementStart = today.minusMonths(1)
        val placementEnd = today.plusMonths(1)
        val fixture = givenChildInDaycare(placementStart, placementEnd)
        db.transaction {
            it.insertServiceNeedOptions()
            it.insert(employee)
            it.insert(
                DevServiceNeed(
                    placementId = fixture.placement.id,
                    startDate = placementStart,
                    endDate = today.minusDays(1),
                    optionId = snDaycareFullDay35.id,
                    confirmedBy = employee.evakaUserId,
                )
            )
            it.insert(
                DevServiceNeed(
                    placementId = fixture.placement.id,
                    startDate = today.plusDays(1),
                    endDate = placementEnd.minusDays(1),
                    optionId = snDaycareFullDay35.id,
                    confirmedBy = employee.evakaUserId,
                )
            )
        }
        val violations = db.read { it.sanityCheckServiceNeedOutsidePlacement() }
        assertEquals(0, violations.size)
    }

    @Test
    fun `sanityCheckGroupPlacementOutsidePlacement positive`() {
        val placementStart = today.minusMonths(1)
        val placementEnd = today.plusMonths(1)
        val fixture = givenChildInDaycare(placementStart, placementEnd)
        val group = DevDaycareGroup(daycareId = fixture.daycare.id)
        db.transaction {
            it.insert(group)
            it.insert(
                DevDaycareGroupPlacement(
                    daycarePlacementId = fixture.placement.id,
                    daycareGroupId = group.id,
                    startDate = placementStart.minusDays(1),
                    endDate = today.minusDays(1),
                )
            )
            it.insert(
                DevDaycareGroupPlacement(
                    daycarePlacementId = fixture.placement.id,
                    daycareGroupId = group.id,
                    startDate = today.plusDays(1),
                    endDate = placementEnd.plusDays(1),
                )
            )
        }
        val violations = db.read { it.sanityCheckGroupPlacementOutsidePlacement() }
        assertEquals(2, violations.size)
    }

    @Test
    fun `sanityCheckGroupPlacementOutsidePlacement negative`() {
        val placementStart = today.minusMonths(1)
        val placementEnd = today.plusMonths(1)
        val fixture = givenChildInDaycare(placementStart, placementEnd)
        val group = DevDaycareGroup(daycareId = fixture.daycare.id)
        db.transaction {
            it.insert(group)
            it.insert(
                DevDaycareGroupPlacement(
                    daycarePlacementId = fixture.placement.id,
                    daycareGroupId = group.id,
                    startDate = placementStart.plusDays(1),
                    endDate = today.minusDays(1),
                )
            )
            it.insert(
                DevDaycareGroupPlacement(
                    daycarePlacementId = fixture.placement.id,
                    daycareGroupId = group.id,
                    startDate = today.plusDays(1),
                    endDate = placementEnd,
                )
            )
        }
        val violations = db.read { it.sanityCheckGroupPlacementOutsidePlacement() }
        assertEquals(0, violations.size)
    }

    @Test
    fun `sanityCheckBackupCareOutsidePlacement positive`() {
        val area = DevCareArea()
        val unit = DevDaycare(areaId = area.id)
        val child1 = DevPerson()
        val child2 = DevPerson()

        db.transaction { tx ->
            tx.insert(area)
            tx.insert(unit)
            tx.insert(child1, DevPersonType.CHILD)
            tx.insert(child2, DevPersonType.CHILD)

            tx.insert(
                DevBackupCare(
                    childId = child1.id,
                    unitId = unit.id,
                    period = FiniteDateRange(today, today),
                )
            )

            tx.insert(
                DevPlacement(
                    childId = child2.id,
                    unitId = unit.id,
                    startDate = today.minusDays(1),
                    endDate = today.minusDays(1),
                )
            )
            tx.insert(
                DevBackupCare(
                    childId = child2.id,
                    unitId = unit.id,
                    period = FiniteDateRange(today, today),
                )
            )
            tx.insert(
                DevPlacement(
                    childId = child2.id,
                    unitId = unit.id,
                    startDate = today.plusDays(1),
                    endDate = today.plusDays(1),
                )
            )
        }

        val violations = db.read { it.sanityCheckBackupCareOutsidePlacement() }
        assertEquals(2, violations.size)
    }

    @Test
    fun `sanityCheckBackupCareOutsidePlacement negative`() {
        val area = DevCareArea()
        val unit = DevDaycare(areaId = area.id)
        val child = DevPerson()

        db.transaction { tx ->
            tx.insert(area)
            tx.insert(unit)
            tx.insert(child, DevPersonType.CHILD)

            tx.insert(
                DevPlacement(
                    childId = child.id,
                    unitId = unit.id,
                    startDate = today.minusDays(1),
                    endDate = today.plusDays(1),
                )
            )
            tx.insert(
                DevBackupCare(
                    childId = child.id,
                    unitId = unit.id,
                    period = FiniteDateRange(today, today),
                )
            )
        }

        val violations = db.read { it.sanityCheckBackupCareOutsidePlacement() }
        assertEquals(0, violations.size)
    }

    @Test
    fun `sanityCheckChildInOverlappingFeeDecisions positive`() {
        // Overlapping ranges
        val range1 = FiniteDateRange(start = today.minusDays(1), end = today.plusDays(1))
        val range2 = FiniteDateRange(start = today, end = today.plusDays(2))

        val area = DevCareArea()
        val unit = DevDaycare(areaId = area.id)
        val guardian1 = DevPerson()
        val guardian2 = DevPerson()
        val child = DevPerson()

        db.transaction { tx ->
            tx.insert(area)
            tx.insert(unit)
            tx.insert(guardian1, DevPersonType.ADULT)
            tx.insert(guardian2, DevPersonType.ADULT)
            tx.insert(child, DevPersonType.CHILD)

            tx.insert(
                    DevFeeDecision(
                        headOfFamilyId = guardian1.id,
                        validDuring = range1,
                        status = FeeDecisionStatus.SENT,
                    )
                )
                .also { id ->
                    tx.insert(
                        DevFeeDecisionChild(
                            feeDecisionId = id,
                            childId = child.id,
                            placementUnitId = unit.id,
                        )
                    )
                }

            tx.insert(
                    DevFeeDecision(
                        headOfFamilyId = guardian2.id,
                        validDuring = range2,
                        status = FeeDecisionStatus.WAITING_FOR_SENDING,
                    )
                )
                .also { id ->
                    tx.insert(
                        DevFeeDecisionChild(
                            feeDecisionId = id,
                            childId = child.id,
                            placementUnitId = unit.id,
                        )
                    )
                }
        }

        val violations =
            db.read {
                it.sanityCheckChildInOverlappingFeeDecisions(
                    listOf(FeeDecisionStatus.SENT, FeeDecisionStatus.WAITING_FOR_SENDING)
                )
            }
        assertEquals(1, violations.size)
    }

    @Test
    fun `sanityCheckChildInOverlappingFeeDecisions negative`() {
        // Non-overlapping ranges
        val range1 = FiniteDateRange(start = today.minusDays(1), end = today.plusDays(1))
        val range2 = FiniteDateRange(start = today.plusDays(2), end = today.plusDays(3))

        val area = DevCareArea()
        val unit = DevDaycare(areaId = area.id)
        val guardian1 = DevPerson()
        val guardian2 = DevPerson()
        val child = DevPerson()

        db.transaction { tx ->
            tx.insert(area)
            tx.insert(unit)
            tx.insert(guardian1, DevPersonType.ADULT)
            tx.insert(guardian2, DevPersonType.ADULT)
            tx.insert(child, DevPersonType.CHILD)

            tx.insert(
                    DevFeeDecision(
                        headOfFamilyId = guardian1.id,
                        validDuring = range1,
                        status = FeeDecisionStatus.SENT,
                    )
                )
                .also { id ->
                    tx.insert(
                        DevFeeDecisionChild(
                            feeDecisionId = id,
                            childId = child.id,
                            placementUnitId = unit.id,
                        )
                    )
                }

            tx.insert(
                    DevFeeDecision(
                        headOfFamilyId = guardian2.id,
                        validDuring = range2,
                        status = FeeDecisionStatus.WAITING_FOR_SENDING,
                    )
                )
                .also { id ->
                    tx.insert(
                        DevFeeDecisionChild(
                            feeDecisionId = id,
                            childId = child.id,
                            placementUnitId = unit.id,
                        )
                    )
                }
        }

        val violations =
            db.read {
                it.sanityCheckChildInOverlappingFeeDecisions(
                    listOf(FeeDecisionStatus.SENT, FeeDecisionStatus.WAITING_FOR_SENDING)
                )
            }
        assertEquals(0, violations.size)
    }

    @Test
    fun `sanityCheckReservationsOutsidePlacements positive`() {
        val area = DevCareArea()
        val unit = DevDaycare(areaId = area.id)
        val child = DevPerson()

        db.transaction { tx ->
            tx.insert(area)
            tx.insert(unit)
            tx.insert(child, DevPersonType.CHILD)

            tx.insert(
                DevPlacement(
                    childId = child.id,
                    unitId = unit.id,
                    startDate = today,
                    endDate = today,
                )
            )
            tx.insert(
                DevReservation(
                    childId = child.id,
                    date = today.plusDays(1),
                    startTime = LocalTime.of(8, 0),
                    endTime = LocalTime.of(16, 0),
                    createdBy = AuthenticatedUser.SystemInternalUser.evakaUserId,
                )
            )
        }

        val violations = db.read { it.sanityCheckReservationsOutsidePlacements(today) }
        assertEquals(1, violations.size)
    }

    @Test
    fun `sanityCheckReservationsOutsidePlacements negative`() {
        val area = DevCareArea()
        val unit = DevDaycare(areaId = area.id)
        val child = DevPerson()

        db.transaction { tx ->
            tx.insert(area)
            tx.insert(unit)
            tx.insert(child, DevPersonType.CHILD)

            tx.insert(
                DevPlacement(
                    childId = child.id,
                    unitId = unit.id,
                    startDate = today,
                    endDate = today,
                )
            )
            tx.insert(
                DevReservation(
                    childId = child.id,
                    date = today,
                    startTime = LocalTime.of(8, 0),
                    endTime = LocalTime.of(16, 0),
                    createdBy = AuthenticatedUser.SystemInternalUser.evakaUserId,
                )
            )
        }

        val violations = db.read { it.sanityCheckReservationsOutsidePlacements(today) }
        assertEquals(0, violations.size)
    }

    @Test
    fun `sanityCheckReservationsDuringFixedSchedulePlacements positive`() {
        val area = DevCareArea()
        val unit = DevDaycare(areaId = area.id)
        val child = DevPerson()

        db.transaction { tx ->
            tx.insert(area)
            tx.insert(unit)
            tx.insert(child, DevPersonType.CHILD)

            tx.insert(
                DevPlacement(
                    childId = child.id,
                    unitId = unit.id,
                    type = PlacementType.PRESCHOOL,
                    startDate = today,
                    endDate = today,
                )
            )
            tx.insert(
                DevReservation(
                    childId = child.id,
                    date = today,
                    startTime = LocalTime.of(8, 0),
                    endTime = LocalTime.of(16, 0),
                    createdBy = AuthenticatedUser.SystemInternalUser.evakaUserId,
                )
            )
        }

        val violations = db.read { it.sanityCheckReservationsDuringFixedSchedulePlacements(today) }
        assertEquals(1, violations.size)
    }

    @Test
    fun `sanityCheckReservationsDuringFixedSchedulePlacements negative`() {
        val area = DevCareArea()
        val unit = DevDaycare(areaId = area.id)
        val child = DevPerson()

        db.transaction { tx ->
            tx.insert(area)
            tx.insert(unit)
            tx.insert(child, DevPersonType.CHILD)

            tx.insert(
                DevPlacement(
                    childId = child.id,
                    unitId = unit.id,
                    type = PlacementType.DAYCARE,
                    startDate = today,
                    endDate = today,
                )
            )
            tx.insert(
                DevReservation(
                    childId = child.id,
                    date = today,
                    startTime = LocalTime.of(8, 0),
                    endTime = LocalTime.of(16, 0),
                    createdBy = AuthenticatedUser.SystemInternalUser.evakaUserId,
                )
            )
        }

        val violations = db.read { it.sanityCheckReservationsDuringFixedSchedulePlacements(today) }
        assertEquals(0, violations.size)
    }

    private data class ChildInDaycareFixture(
        val daycare: DevDaycare,
        val child: DevPerson,
        val placement: DevPlacement,
    )

    private fun givenChildInDaycare(
        startDate: LocalDate,
        endDate: LocalDate,
    ): ChildInDaycareFixture {
        val area = DevCareArea()
        val daycare = DevDaycare(areaId = area.id)
        val child = DevPerson()
        val placement =
            DevPlacement(
                childId = child.id,
                unitId = daycare.id,
                startDate = startDate,
                endDate = endDate,
            )
        db.transaction {
            it.insert(area)
            it.insert(daycare)
            it.insert(child, DevPersonType.CHILD)
            it.insert(placement)
        }
        return ChildInDaycareFixture(daycare = daycare, child = child, placement = placement)
    }
}
