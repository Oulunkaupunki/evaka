// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.pis

import com.github.kittinunf.fuel.core.extensions.jsonBody
import com.github.kittinunf.fuel.core.isSuccessful
import com.github.kittinunf.fuel.jackson.responseObject
import fi.espoo.evaka.FullApplicationTest
import fi.espoo.evaka.identity.ExternalId
import fi.espoo.evaka.pairing.MobileDeviceIdentity
import fi.espoo.evaka.shared.AreaId
import fi.espoo.evaka.shared.DaycareId
import fi.espoo.evaka.shared.EmployeeId
import fi.espoo.evaka.shared.MobileDeviceId
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.auth.UserRole
import fi.espoo.evaka.shared.auth.asUser
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.dev.DevCareArea
import fi.espoo.evaka.shared.dev.DevDaycare
import fi.espoo.evaka.shared.dev.DevEmployee
import fi.espoo.evaka.shared.dev.DevMobileDevice
import fi.espoo.evaka.shared.dev.insertTestCareArea
import fi.espoo.evaka.shared.dev.insertTestDaycare
import fi.espoo.evaka.shared.dev.insertTestEmployee
import fi.espoo.evaka.shared.dev.insertTestMobileDevice
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SystemControllerTest : FullApplicationTest(resetDbBeforeEach = true) {
    private lateinit var areaId: AreaId
    private lateinit var unitId: DaycareId

    @BeforeEach
    protected fun beforeEach() {
        areaId = db.transaction { it.insertTestCareArea(DevCareArea()) }
        unitId = db.transaction { it.insertTestDaycare(DevDaycare(areaId = areaId)) }
    }

    @Test
    fun `employee login works without employee number`() {
        val externalId = ExternalId.of("evaka", "123456")
        val employeeId = EmployeeId(UUID.randomUUID())
        val inputJson = """
            {"externalId": "$externalId", "firstName": "Teppo", "lastName": "Testaaja", "email": null}
        """.trimIndent()

        val (_, res, result) = http.post("/system/employee-login")
            .asUser(AuthenticatedUser.SystemInternalUser)
            .jsonBody(inputJson)
            .responseObject<EmployeeUser>()

        assertTrue(res.isSuccessful)
        val expected = EmployeeUser(
            id = employeeId, employeeNumber = null,
            firstName = "Teppo", lastName = "Testaaja", globalRoles = setOf(), allScopedRoles = setOf()
        )
        assertEquals(expected, result.get().copy(id = employeeId))
    }

    @Test
    fun `employee number is set for new employee`() {
        val externalId = ExternalId.of("evaka", "123456")
        val employeeId = EmployeeId(UUID.randomUUID())
        val input = SystemController.EmployeeLoginRequest(
            externalId = externalId, employeeNumber = "666666",
            firstName = "Teppo", lastName = "Testaaja", email = null
        )

        val (_, res, result) = http.post("/system/employee-login")
            .asUser(AuthenticatedUser.SystemInternalUser)
            .jsonBody(jsonMapper.writeValueAsString(input))
            .responseObject<EmployeeUser>()

        assertTrue(res.isSuccessful)
        val expected = EmployeeUser(
            id = employeeId, employeeNumber = "666666",
            firstName = "Teppo", lastName = "Testaaja", globalRoles = setOf(), allScopedRoles = setOf()
        )
        assertEquals(expected, result.get().copy(id = employeeId))
    }

    @Test
    fun `employee number is set for existing employee`() {
        val externalId = ExternalId.of("evaka", "123456")
        val employeeId = EmployeeId(UUID.randomUUID())
        val input = SystemController.EmployeeLoginRequest(
            externalId = externalId, employeeNumber = "666666",
            firstName = "Teppo", lastName = "Testaaja", email = null
        )
        db.transaction { tx ->
            tx.insertTestEmployee(DevEmployee(id = employeeId, externalId = externalId, roles = setOf(UserRole.FINANCE_ADMIN)))
        }

        val (_, res, result) = http.post("/system/employee-login")
            .asUser(AuthenticatedUser.SystemInternalUser)
            .jsonBody(jsonMapper.writeValueAsString(input))
            .responseObject<EmployeeUser>()

        assertTrue(res.isSuccessful)
        val expected = EmployeeUser(
            id = employeeId, employeeNumber = "666666",
            firstName = "Teppo", lastName = "Testaaja", globalRoles = setOf(UserRole.FINANCE_ADMIN), allScopedRoles = setOf()
        )
        assertEquals(expected, result.get())
    }

    @Test
    fun `mobile identity endpoint can find a device by its token`() {
        val token = UUID.randomUUID()
        val deviceId = db.transaction { it.insertTestDevice(longTermToken = token) }

        val (_, res, result) = http.get("/system/mobile-identity/$token").asUser(AuthenticatedUser.SystemInternalUser)
            .responseObject<MobileDeviceIdentity>()
        assertTrue(res.isSuccessful)
        assertEquals(MobileDeviceIdentity(id = deviceId, longTermToken = token), result.get())
    }

    private fun Database.Transaction.insertTestDevice(longTermToken: UUID? = null): MobileDeviceId {
        val id = MobileDeviceId(UUID.randomUUID())
        insertTestMobileDevice(
            DevMobileDevice(
                id = id,
                unitId = unitId,
                longTermToken = longTermToken,
            )
        )
        return id
    }
}
