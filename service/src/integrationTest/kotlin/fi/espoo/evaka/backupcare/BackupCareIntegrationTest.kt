// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.backupcare

import com.github.kittinunf.fuel.core.extensions.jsonBody
import com.github.kittinunf.fuel.core.isSuccessful
import com.github.kittinunf.fuel.jackson.responseObject
import fi.espoo.evaka.FullApplicationTest
import fi.espoo.evaka.insertGeneralTestFixtures
import fi.espoo.evaka.placement.PlacementType
import fi.espoo.evaka.shared.BackupCareId
import fi.espoo.evaka.shared.ChildId
import fi.espoo.evaka.shared.DaycareId
import fi.espoo.evaka.shared.EvakaUserId
import fi.espoo.evaka.shared.GroupId
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.auth.UserRole
import fi.espoo.evaka.shared.auth.asUser
import fi.espoo.evaka.shared.dev.DevDaycareGroup
import fi.espoo.evaka.shared.dev.DevPlacement
import fi.espoo.evaka.shared.dev.insertTestDaycareGroup
import fi.espoo.evaka.shared.dev.insertTestPlacement
import fi.espoo.evaka.shared.dev.insertTestServiceNeed
import fi.espoo.evaka.shared.dev.resetDatabase
import fi.espoo.evaka.shared.domain.FiniteDateRange
import fi.espoo.evaka.snDefaultDaycare
import fi.espoo.evaka.test.getBackupCareRowById
import fi.espoo.evaka.test.getBackupCareRowsByChild
import fi.espoo.evaka.testChild_1
import fi.espoo.evaka.testDaycare
import fi.espoo.evaka.testDaycare2
import fi.espoo.evaka.testDecisionMaker_1
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class BackupCareIntegrationTest : FullApplicationTest() {
    private val serviceWorker = AuthenticatedUser.Employee(testDecisionMaker_1.id.raw, setOf(UserRole.SERVICE_WORKER))

    @BeforeEach
    private fun beforeEach() {
        db.transaction { tx ->
            tx.resetDatabase()
            tx.insertGeneralTestFixtures()
        }
    }

    @Test
    fun testUpdate() {
        val groupId = db.transaction { tx -> tx.insertTestDaycareGroup(DevDaycareGroup(daycareId = testDaycare.id)) }
        val period = FiniteDateRange(LocalDate.of(2020, 7, 1), LocalDate.of(2020, 7, 31))
        val id = createBackupCareAndAssert(period = period)
        val changedPeriod = period.copy(end = LocalDate.of(2020, 7, 7))
        val (_, res, _) = http.post("/backup-cares/$id")
            .jsonBody(
                objectMapper.writeValueAsString(
                    BackupCareUpdateRequest(
                        groupId = groupId,
                        period = changedPeriod
                    )
                )
            )
            .asUser(serviceWorker)
            .response()
        assertTrue(res.isSuccessful)
        db.read { r ->
            r.getBackupCareRowsByChild(testChild_1.id).one().also {
                assertEquals(id, it.id)
                assertEquals(testChild_1.id, it.childId)
                assertEquals(testDaycare.id, it.unitId)
                assertEquals(groupId, it.groupId)
                assertEquals(changedPeriod, it.period())
            }
        }
    }

    @Test
    fun testOverlapError() {
        createBackupCareAndAssert()
        val (_, res, _) = http.post("/children/${testChild_1.id}/backup-cares")
            .jsonBody(
                objectMapper.writeValueAsString(
                    NewBackupCare(
                        unitId = testDaycare.id,
                        groupId = null,
                        period = FiniteDateRange(LocalDate.of(2020, 7, 31), LocalDate.of(2020, 8, 1))
                    )
                )
            )
            .asUser(serviceWorker)
            .response()
        assertEquals(409, res.statusCode)
    }

    @Test
    fun testChildBackupCare() {
        val groupName = "Test Group"
        val groupId = db.transaction { it.insertTestDaycareGroup(DevDaycareGroup(daycareId = testDaycare.id, name = groupName)) }
        val id = createBackupCareAndAssert(groupId = groupId)
        val (_, res, result) = http.get("/children/${testChild_1.id}/backup-cares")
            .asUser(serviceWorker)
            .responseObject<ChildBackupCaresResponse>(objectMapper)
        assertTrue(res.isSuccessful)
        val backupCares = result.get().backupCares

        assertEquals(
            listOf(
                ChildBackupCare(
                    id = id,
                    unit = BackupCareUnit(
                        id = testDaycare.id,
                        name = testDaycare.name
                    ),
                    group = BackupCareGroup(
                        id = groupId,
                        name = groupName
                    ),
                    period = FiniteDateRange(LocalDate.of(2020, 7, 1), LocalDate.of(2020, 7, 31))
                )
            ),
            backupCares
        )
    }

    @Test
    fun testUnitBackupCare() {
        val groupName = "Test Group"
        val period = FiniteDateRange(LocalDate.of(2020, 7, 1), LocalDate.of(2020, 7, 31))
        val serviceNeedPeriod = FiniteDateRange(LocalDate.of(2020, 7, 3), period.end)
        val groupId = db.transaction { tx ->
            tx.insertTestDaycareGroup(DevDaycareGroup(daycareId = testDaycare.id, name = groupName))
        }
        db.transaction { tx ->
            val placementId = tx.insertTestPlacement(
                DevPlacement(
                    childId = testChild_1.id,
                    type = PlacementType.DAYCARE,
                    unitId = testDaycare2.id,
                    startDate = period.start.minusYears(1),
                    endDate = period.end.plusYears(1)
                )
            )
            tx.insertTestServiceNeed(
                confirmedBy = EvakaUserId(testDecisionMaker_1.id.raw),
                period = serviceNeedPeriod,
                placementId = placementId,
                optionId = snDefaultDaycare.id
            )
        }
        val id = createBackupCareAndAssert(groupId = groupId)
        val (_, res, result) = http.get(
            "/daycares/${testDaycare.id}/backup-cares",
            listOf(
                "startDate" to period.start.plusDays(1),
                "endDate" to period.end.minusDays(1)
            )
        )
            .asUser(serviceWorker)
            .responseObject<UnitBackupCaresResponse>(objectMapper)
        assertTrue(res.isSuccessful)
        val backupCares = result.get().backupCares

        assertEquals(
            listOf(
                UnitBackupCare(
                    id = id,
                    child = BackupCareChild(
                        id = testChild_1.id,
                        firstName = testChild_1.firstName,
                        lastName = testChild_1.lastName,
                        birthDate = testChild_1.dateOfBirth
                    ),
                    group = BackupCareGroup(
                        id = groupId,
                        name = groupName
                    ),
                    period = period,
                    serviceNeeds = setOf(),
                    missingServiceNeedDays = ChronoUnit.DAYS.between(period.start, serviceNeedPeriod.start).toInt()
                )
            ),
            backupCares
        )
    }

    private fun createBackupCareAndAssert(
        childId: ChildId = testChild_1.id,
        unitId: DaycareId = testDaycare.id,
        groupId: GroupId? = null,
        period: FiniteDateRange = FiniteDateRange(LocalDate.of(2020, 7, 1), LocalDate.of(2020, 7, 31))
    ): BackupCareId {
        val (_, res, result) = http.post("/children/$childId/backup-cares")
            .jsonBody(
                objectMapper.writeValueAsString(
                    NewBackupCare(
                        unitId = unitId,
                        groupId = groupId,
                        period = period
                    )
                )
            )
            .asUser(serviceWorker)
            .responseObject<BackupCareCreateResponse>(objectMapper)
        assertTrue(res.isSuccessful)

        val id = result.get().id

        db.read { r ->
            r.getBackupCareRowById(id).one().also {
                assertEquals(id, it.id)
                assertEquals(childId, it.childId)
                assertEquals(unitId, it.unitId)
                assertEquals(groupId, it.groupId)
                assertEquals(period, it.period())
            }
        }
        return id
    }
}
