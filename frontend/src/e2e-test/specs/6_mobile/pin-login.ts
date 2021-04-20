// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import config from 'e2e-test-common/config'
import {
  initializeAreaAndPersonData,
  AreaAndPersonFixtures
} from 'e2e-test-common/dev-api/data-init'
import { logConsoleMessages } from '../../utils/fixture'
import {
  deleteDaycareDailyNotes,
  deleteEmployeeById,
  deleteMobileDevice,
  deletePairing,
  insertBackupPickups,
  insertChildFixtures,
  insertDaycareGroupPlacementFixtures,
  insertDaycarePlacementFixtures,
  insertFamilyContacts,
  insertFridgeChildren,
  insertFridgePartners,
  postMobileDevice,
  setAclForDaycares
} from 'e2e-test-common/dev-api'
import { mobileAutoSignInRole } from '../../config/users'
import { t } from 'testcafe'
import {
  CareAreaBuilder,
  createDaycarePlacementFixture,
  DaycareBuilder,
  DaycareGroupBuilder,
  EmployeeBuilder,
  EmployeePinBuilder,
  enduserChildFixtureJari,
  enduserChildJariOtherGuardianFixture,
  enduserGuardianFixture,
  Fixture,
  uuidv4
} from 'e2e-test-common/dev-api/fixtures'
import MobileGroupsPage from '../../pages/employee/mobile/mobile-groups'
import {
  ApplicationPersonDetail,
  BackupPickup,
  Child,
  DaycarePlacement,
  FamilyContact
} from 'e2e-test-common/dev-api/types'
import LocalDate from '../../../lib-common/local-date'

let fixtures: AreaAndPersonFixtures
let cleanUp: () => Promise<void>

const employeeId = uuidv4()
const mobileDeviceId = employeeId
const mobileLongTermToken = uuidv4()
const pairingId = uuidv4()
const daycareGroupPlacementId = uuidv4()

let daycarePlacementFixture: DaycarePlacement
let daycareGroup: DaycareGroupBuilder
let daycare: DaycareBuilder
let careArea: CareAreaBuilder
let employee: EmployeeBuilder

let child: ApplicationPersonDetail
let employeePin: EmployeePinBuilder

const pin = '2580'

fixture('Mobile PIN login')
  .meta({ type: 'regression', subType: 'mobile' })
  .page(config.adminUrl)
  .before(async () => {
    ;[fixtures, cleanUp] = await initializeAreaAndPersonData()

    child = fixtures.enduserChildFixtureJari

    employee = await Fixture.employee()
      .with({
        id: employeeId,
        externalId: `espooad: ${employeeId}`,
        firstName: 'Yrjö',
        lastName: 'Yksikkö',
        email: 'yy@example.com',
        roles: []
      })
      .save()

    employeePin = await Fixture.employeePin()
      .with({ userId: employee.data.id, pin })
      .save()
    careArea = await Fixture.careArea().save()
    daycare = await Fixture.daycare().careArea(careArea).save()
    daycareGroup = await Fixture.daycareGroup().daycare(daycare).save()
    daycarePlacementFixture = createDaycarePlacementFixture(
      uuidv4(),
      child.id,
      daycare.data.id
    )

    await setAclForDaycares(employee.data.externalId, daycare.data.id)

    await insertDaycarePlacementFixtures([daycarePlacementFixture])
    await insertDaycareGroupPlacementFixtures([
      {
        id: daycareGroupPlacementId,
        daycareGroupId: daycareGroup.data.id,
        daycarePlacementId: daycarePlacementFixture.id,
        startDate: daycarePlacementFixture.startDate,
        endDate: daycarePlacementFixture.endDate
      }
    ])

    await postMobileDevice({
      id: mobileDeviceId,
      unitId: daycare.data.id,
      name: 'testMobileDevice',
      deleted: false,
      longTermToken: mobileLongTermToken
    })
  })
  .beforeEach(async () => {
    await t.useRole(mobileAutoSignInRole(mobileLongTermToken))
  })
  .afterEach(async (t) => {
    await logConsoleMessages(t)
    await deleteDaycareDailyNotes()
  })
  .after(async () => {
    await deletePairing(pairingId)
    await deleteMobileDevice(mobileDeviceId)
    await cleanUp()
    await deleteEmployeeById(employeeId)
  })

const mobileGroupsPage = new MobileGroupsPage()

test('User can login with PIN and see child hipsu s sensitive info', async (t) => {
  const childAdditionalInfo: Child = {
    id: child.id,
    allergies: 'Allergies',
    diet: 'Diets',
    medication: 'Medications'
  }

  await insertChildFixtures([childAdditionalInfo])

  const contacts: FamilyContact[] = [
    {
      id: uuidv4(),
      childId: child.id,
      contactPersonId: enduserGuardianFixture.id,
      priority: 1
    },
    {
      id: uuidv4(),
      childId: child.id,
      contactPersonId: enduserChildJariOtherGuardianFixture.id,
      priority: 2
    }
  ]

  await insertFamilyContacts(contacts)

  const backupPickups: BackupPickup[] = [
    {
      id: uuidv4(),
      childId: child.id,
      name: 'Backup pickup 1',
      phone: '1'
    },
    {
      id: uuidv4(),
      childId: child.id,
      name: 'Backup pickup 2',
      phone: '2'
    }
  ]

  await insertBackupPickups(backupPickups)

  await insertFridgeChildren([
    {
      id: uuidv4(),
      childId: child.id,
      headOfChild: enduserGuardianFixture.id,
      startDate: LocalDate.today(),
      endDate: LocalDate.today()
    }
  ])

  const parentshipId = uuidv4()
  await insertFridgePartners([
    {
      partnershipId: parentshipId,
      indx: 1,
      personId: enduserGuardianFixture.id,
      startDate: LocalDate.today(),
      endDate: LocalDate.today()
    },
    {
      partnershipId: parentshipId,
      indx: 2,
      personId: enduserChildJariOtherGuardianFixture.id,
      startDate: LocalDate.today(),
      endDate: LocalDate.today()
    }
  ])

  await t
    .expect(mobileGroupsPage.childName(child.id).textContent)
    .eql(`${child.firstName} ${child.lastName}`)

  await t.click(mobileGroupsPage.childRow(enduserChildFixtureJari.id))
  await t.click(mobileGroupsPage.childSensitiveInfoLink)

  await t.click(mobileGroupsPage.pinLoginStaffSelector)
  await t
    .typeText(mobileGroupsPage.pinLoginStaffSelector, employee.data.lastName)
    .pressKey('tab')

  await t.typeText(mobileGroupsPage.pinInput, employeePin.data.pin)
  await t.click(mobileGroupsPage.submitPin)

  await t
    .expect(mobileGroupsPage.childInfoName.textContent)
    .eql(`${child.firstName} ${child.lastName}`)

  await t
    .expect(mobileGroupsPage.childInfoChildAddress.textContent)
    .eql(child.streetAddress)

  await t
    .expect(mobileGroupsPage.childInfoAllergies.textContent)
    .eql(childAdditionalInfo.allergies)

  await t
    .expect(mobileGroupsPage.childInfoDiet.textContent)
    .eql(childAdditionalInfo.diet)

  await t
    .expect(mobileGroupsPage.childInfoMedication.textContent)
    .eql(childAdditionalInfo.medication)

  await t
    .expect(mobileGroupsPage.childInfoContact1Name.textContent)
    .eql(
      `${enduserGuardianFixture.firstName} ${enduserGuardianFixture.lastName}`
    )

  await t
    .expect(mobileGroupsPage.childInfoContact1Phone.textContent)
    .eql(enduserGuardianFixture.phone)

  await t
    .expect(mobileGroupsPage.childInfoContact1Email.textContent)
    .eql(enduserGuardianFixture.email)

  await t
    .expect(mobileGroupsPage.childInfoContact2Name.textContent)
    .eql(
      `${enduserChildJariOtherGuardianFixture.firstName} ${enduserChildJariOtherGuardianFixture.lastName}`
    )

  await t
    .expect(mobileGroupsPage.childInfoContact2Phone.textContent)
    .eql(enduserChildJariOtherGuardianFixture.phone)

  await t
    .expect(
      mobileGroupsPage.childInfoContact2Email.with({ timeout: 2000 }).visible
    )
    .notOk()

  await t
    .expect(mobileGroupsPage.childInfoBackupPickup1Name.textContent)
    .eql(backupPickups[0].name)

  await t
    .expect(mobileGroupsPage.childInfoBackupPickup1Phone.textContent)
    .eql(backupPickups[0].phone)

  await t
    .expect(mobileGroupsPage.childInfoBackupPickup2Name.textContent)
    .eql(backupPickups[1].name)

  await t
    .expect(mobileGroupsPage.childInfoBackupPickup2Phone.textContent)
    .eql(backupPickups[1].phone)
})

test('Wrong pin shows error, and user can log in with correct pin after that', async (t) => {
  await t
    .expect(mobileGroupsPage.childName(child.id).textContent)
    .eql(`${child.firstName} ${child.lastName}`)

  await t.click(mobileGroupsPage.childRow(enduserChildFixtureJari.id))
  await t.click(mobileGroupsPage.childSensitiveInfoLink)

  await t.click(mobileGroupsPage.pinLoginStaffSelector)
  await t
    .typeText(mobileGroupsPage.pinLoginStaffSelector, employee.data.lastName)
    .pressKey('tab')

  await t.typeText(mobileGroupsPage.pinInput, '9999')
  await t.click(mobileGroupsPage.submitPin)

  await t.expect(mobileGroupsPage.pinInputInfo.visible).ok()

  await t
    .expect(mobileGroupsPage.pinInputInfo.textContent)
    .eql('Väärä PIN-koodi')

  await t
    .typeText(mobileGroupsPage.pinLoginStaffSelector, employee.data.lastName)
    .pressKey('tab')

  await t.typeText(mobileGroupsPage.pinInput, employeePin.data.pin, {
    replace: true
  })
  await t.click(mobileGroupsPage.submitPin)

  await t
    .expect(mobileGroupsPage.childInfoName.textContent)
    .eql(`${child.firstName} ${child.lastName}`)
})

test('After successful PIN login user can log out after which new PIN is required', async (t) => {
  await t
    .expect(mobileGroupsPage.childName(child.id).textContent)
    .eql(`${child.firstName} ${child.lastName}`)

  await t.click(mobileGroupsPage.childRow(enduserChildFixtureJari.id))
  await t.click(mobileGroupsPage.childSensitiveInfoLink)

  await t
    .typeText(mobileGroupsPage.pinLoginStaffSelector, employee.data.lastName)
    .pressKey('tab')

  await t.typeText(mobileGroupsPage.pinInput, employeePin.data.pin, {
    replace: true
  })
  await t.click(mobileGroupsPage.submitPin)

  await t
    .expect(mobileGroupsPage.childInfoName.textContent)
    .eql(`${child.firstName} ${child.lastName}`)

  await t.click(mobileGroupsPage.logoutButton)
  await t.expect(mobileGroupsPage.acceptLogoutButton.visible).ok()

  // Click logout modal away and check that info still shows
  await t.click(mobileGroupsPage.cancelLogoutButton)
  await t
    .expect(mobileGroupsPage.childInfoName.textContent)
    .eql(`${child.firstName} ${child.lastName}`)

  // Click logout modal, log out and check we are back at child page
  await t.click(mobileGroupsPage.logoutButton)
  await t.click(mobileGroupsPage.acceptLogoutButton)

  await t.expect(mobileGroupsPage.childSensitiveInfoLink.visible).ok()
})
