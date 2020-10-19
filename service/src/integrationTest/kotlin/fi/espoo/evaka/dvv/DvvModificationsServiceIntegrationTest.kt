// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later
package fi.espoo.evaka.dvv

import fi.espoo.evaka.pis.getPersonBySSN
import fi.espoo.evaka.resetDatabase
import fi.espoo.evaka.shared.db.handle
import fi.espoo.evaka.shared.dev.DevPerson
import fi.espoo.evaka.shared.dev.insertTestPerson
import fi.espoo.evaka.vtjclient.dto.NativeLanguage
import fi.espoo.evaka.vtjclient.dto.RestrictedDetails
import fi.espoo.evaka.vtjclient.dto.VtjPerson
import fi.espoo.evaka.vtjclient.service.persondetails.MockPersonDetailsService
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.util.UUID

class DvvModificationsServiceIntegrationTest : DvvModificationsServiceIntegrationTestBase() {

    @BeforeEach
    private fun beforeEach() {
        jdbi.handle { h ->
            resetDatabase(h)
            storeDvvModificationToken(h, "100", "101", 0, 0)
        }
    }

    @AfterEach
    private fun afterEach() {
        jdbi.handle { h ->
            deleteDvvModificationToken(h, "100")
        }
    }

    @Test
    fun `get modification token for today`() = jdbi.handle { h ->
        assertEquals("101", getNextDvvModificationToken(h))
        val response = dvvModificationsService.getDvvModifications(listOf("nimenmuutos"))
        assertEquals(1, response.size)
        assertEquals("102", getNextDvvModificationToken(h))
        val createdDvvModificationToken = getDvvModificationToken(h, "101")!!
        assertEquals("101", createdDvvModificationToken.token)
        assertEquals("102", createdDvvModificationToken.nextToken)
        assertEquals(1, createdDvvModificationToken.ssnsSent)
        assertEquals(1, createdDvvModificationToken.modificationsReceived)

        deleteDvvModificationToken(h, "101")
    }

    @Test
    fun `person date of death`() = jdbi.handle { h ->
        createTestPerson(testPerson.copy(ssn = "010180-999A"))
        dvvModificationsService.updatePersonsFromDvv(listOf("010180-999A"))
        assertEquals(LocalDate.parse("2019-07-30"), h.getPersonBySSN("010180-999A")?.dateOfDeath)
    }

    @Test
    fun `person restricted details started`() = jdbi.handle { h ->
        createTestPerson(testPerson.copy(ssn = "020180-999Y"))
        dvvModificationsService.updatePersonsFromDvv(listOf("020180-999Y"))
        val modifiedPerson = h.getPersonBySSN("020180-999Y")!!
        assertEquals(true, modifiedPerson.restrictedDetailsEnabled)
        assertEquals("", modifiedPerson.streetAddress)
        assertEquals("", modifiedPerson.postalCode)
        assertEquals("", modifiedPerson.postOffice)
    }

    @Test
    fun `person restricted details ended and address is set`() = jdbi.handle { h ->
        createTestPerson(testPerson.copy(ssn = "030180-999L", restrictedDetailsEnabled = true, streetAddress = "", postalCode = "", postOffice = ""))
        dvvModificationsService.updatePersonsFromDvv(listOf("030180-999L"))
        val modifiedPerson = h.getPersonBySSN("030180-999L")!!
        assertEquals(false, modifiedPerson.restrictedDetailsEnabled)
        assertEquals(LocalDate.parse("2030-01-01"), modifiedPerson.restrictedDetailsEndDate)
        assertEquals("Vanhakatu 10h5 3", modifiedPerson.streetAddress)
        assertEquals("02230", modifiedPerson.postalCode)
        assertEquals("Espoo", modifiedPerson.postOffice)
    }

    @Test
    fun `person address change`() = jdbi.handle { h ->
        createTestPerson(testPerson.copy(ssn = "040180-9998"))
        dvvModificationsService.updatePersonsFromDvv(listOf("040180-9998"))
        val modifiedPerson = h.getPersonBySSN("040180-9998")!!
        assertEquals("Uusitie 17 A 2", modifiedPerson.streetAddress)
        assertEquals("02940", modifiedPerson.postalCode)
        assertEquals("ESPOO", modifiedPerson.postOffice)
    }

    @Test
    fun `person ssn change`() = jdbi.handle { h ->
        val testId = createTestPerson(testPerson.copy(ssn = "010181-999K"))
        dvvModificationsService.updatePersonsFromDvv(listOf("010181-999K"))
        assertEquals(testId, h.getPersonBySSN("010281-999C")?.id)
    }

    @Test
    fun `new custodian added`() = jdbi.handle { h ->
        createTestPerson(testPerson.copy(ssn = "050180-999W"))
        createVtjPerson(testPerson.copy(firstName = "Harri", lastName = "Huollettava", ssn = "050118A999W"))
        dvvModificationsService.updatePersonsFromDvv(listOf("050180-999W"))
        val custodian = h.getPersonBySSN("050118A999W")!!
        assertEquals("Harri", custodian.firstName)
        assertEquals("Huollettava", custodian.lastName)
    }

    val testPerson = DevPerson(
        id = UUID.randomUUID(),
        ssn = "set this",
        dateOfBirth = LocalDate.parse("1980-01-01"),
        dateOfDeath = null,
        firstName = "etunimi",
        lastName = "sukunimi",
        streetAddress = "Katuosoite",
        postalCode = "02230",
        postOffice = "Espoo",
        restrictedDetailsEnabled = false
    )

    private fun createTestPerson(devPerson: DevPerson): UUID = jdbi.handle { h ->
        h.insertTestPerson(devPerson)
    }

    private fun createVtjPerson(person: DevPerson) {
        MockPersonDetailsService.upsertPerson(
            VtjPerson(
                socialSecurityNumber = person.ssn!!,
                firstNames = person.firstName,
                lastName = person.lastName,
                nativeLanguage = NativeLanguage(languageName = "FI", code = "fi"),
                restrictedDetails = RestrictedDetails(enabled = person.restrictedDetailsEnabled, endDate = person.restrictedDetailsEndDate)
            )
        )
    }

    private fun deleteVtjPerson(ssn: String) {
        MockPersonDetailsService.deletePerson(ssn)
    }
}
