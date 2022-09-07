// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import LocalDate from 'lib-common/local-date'

import { insertDefaultServiceNeedOptions, resetDatabase } from '../../dev-api'
import {
  AreaAndPersonFixtures,
  initializeAreaAndPersonData
} from '../../dev-api/data-init'
import { daycareGroupFixture, Fixture } from '../../dev-api/fixtures'
import { UnitPage } from '../../pages/employee/units/unit'
import { Page } from '../../utils/page'
import { employeeLogin } from '../../utils/user'

let fixtures: AreaAndPersonFixtures
let page: Page
let unitPage: UnitPage

const today = LocalDate.todayInSystemTz()

beforeEach(async () => {
  await resetDatabase()
  fixtures = await initializeAreaAndPersonData()
  await insertDefaultServiceNeedOptions()
  const group = await Fixture.daycareGroup().with(daycareGroupFixture).save()

  await Fixture.placement()
    .with({
      childId: fixtures.enduserChildFixtureJari.id,
      unitId: fixtures.daycareFixture.id,
      startDate: today.formatIso(),
      endDate: today.addYears(1).formatIso()
    })
    .save()
  const kaarinaPlacement = await Fixture.placement()
    .with({
      childId: fixtures.enduserChildFixtureKaarina.id,
      unitId: fixtures.daycareFixture.id,
      type: 'PRESCHOOL_DAYCARE',
      startDate: today.formatIso(),
      endDate: today.addYears(1).formatIso()
    })
    .save()
  await Fixture.groupPlacement()
    .withPlacement(kaarinaPlacement)
    .withGroup(group)
    .save()

  const unitSupervisor = await Fixture.employeeUnitSupervisor(
    fixtures.daycareFixture.id
  ).save()

  page = await Page.open()
  await employeeLogin(page, unitSupervisor.data)
  unitPage = new UnitPage(page)
})

describe('Employee - Absences', () => {
  test('User can place a child into a group and remove the child from the group', async () => {
    await unitPage.navigateToUnit(fixtures.daycareFixture.id)
    const groupsPage = await unitPage.openGroupsPage()

    const missingPlacementsSection = groupsPage.missingPlacementsSection
    await missingPlacementsSection.createGroupPlacementForChild(0)

    const groupSection = await groupsPage.openGroupCollapsible(
      daycareGroupFixture.id
    )

    await missingPlacementsSection.assertRowCount(0)
    await groupSection.assertChildCount(2)

    await groupSection.removeGroupPlacement(0)
    await missingPlacementsSection.assertRowCount(1)
    await groupSection.assertChildCount(1)
  })

  test('User can open the diary page and add an absence for a child with only one absence category', async () => {
    await unitPage.navigateToUnit(fixtures.daycareFixture.id)
    const groupsPage = await unitPage.openGroupsPage()

    const missingPlacementsSection = groupsPage.missingPlacementsSection
    await missingPlacementsSection.createGroupPlacementForChild(0)

    const groupSection = await groupsPage.openGroupCollapsible(
      daycareGroupFixture.id
    )
    const diaryPage = await groupSection.openDiary()

    // Can add an absence
    await diaryPage.addAbsenceToChild(
      fixtures.enduserChildFixtureJari.id,
      today,
      'SICKLEAVE'
    )
    await diaryPage.childHasAbsence(
      fixtures.enduserChildFixtureJari.id,
      today,
      'SICKLEAVE',
      'BILLABLE'
    )

    // Can change the absence type
    await diaryPage.addAbsenceToChild(
      fixtures.enduserChildFixtureJari.id,
      today,
      'UNKNOWN_ABSENCE'
    )
    await diaryPage.childHasAbsence(
      fixtures.enduserChildFixtureJari.id,
      today,
      'UNKNOWN_ABSENCE',
      'BILLABLE'
    )

    // Hover shows type and who is the absence maker
    await diaryPage.assertTooltipContains(
      fixtures.enduserChildFixtureJari.id,
      today,
      [
        'Varhaiskasvatus: Ilmoittamaton poissaolo',
        `${LocalDate.todayInSystemTz().formatIso()} Henkilökunta)`
      ]
    )

    // Can clear an absence
    await diaryPage.addAbsenceToChild(
      fixtures.enduserChildFixtureJari.id,
      today,
      'NO_ABSENCE'
    )
    await diaryPage.childHasNoAbsence(
      fixtures.enduserChildFixtureJari.id,
      today,
      'BILLABLE'
    )
  })

  test('User can open the diary page and add an absence for a child with two absence categories', async () => {
    await unitPage.navigateToUnit(fixtures.daycareFixture.id)
    const groupsPage = await unitPage.openGroupsPage()
    const groupSection = await groupsPage.openGroupCollapsible(
      daycareGroupFixture.id
    )
    const diaryPage = await groupSection.openDiary()

    // Can add an absence
    await diaryPage.addAbsenceToChild(
      fixtures.enduserChildFixtureKaarina.id,
      today,
      'SICKLEAVE',
      ['BILLABLE']
    )
    await diaryPage.childHasAbsence(
      fixtures.enduserChildFixtureKaarina.id,
      today,
      'SICKLEAVE',
      'BILLABLE'
    )

    // Can change the absence type
    await diaryPage.addAbsenceToChild(
      fixtures.enduserChildFixtureKaarina.id,
      today,
      'UNKNOWN_ABSENCE',
      ['NONBILLABLE']
    )
    await diaryPage.childHasAbsence(
      fixtures.enduserChildFixtureKaarina.id,
      today,
      'UNKNOWN_ABSENCE',
      'NONBILLABLE'
    )

    // Hover shows type and who is the absence maker
    await diaryPage.assertTooltipContains(
      fixtures.enduserChildFixtureKaarina.id,
      today,
      [
        'Varhaiskasvatus: Ilmoittamaton poissaolo',
        `${LocalDate.todayInSystemTz().formatIso()} Henkilökunta)`
      ]
    )

    // Can clear an absence
    await diaryPage.addAbsenceToChild(
      fixtures.enduserChildFixtureKaarina.id,
      today,
      'NO_ABSENCE',
      ['BILLABLE', 'NONBILLABLE']
    )
    await diaryPage.childHasNoAbsence(
      fixtures.enduserChildFixtureKaarina.id,
      today,
      'BILLABLE'
    )
    await diaryPage.childHasNoAbsence(
      fixtures.enduserChildFixtureKaarina.id,
      today,
      'NONBILLABLE'
    )
  })

  test('User can add a staff attendance', async () => {
    await unitPage.navigateToUnit(fixtures.daycareFixture.id)
    const groupsPage = await unitPage.openGroupsPage()

    const missingPlacementsSection = groupsPage.missingPlacementsSection
    await missingPlacementsSection.createGroupPlacementForChild(0)

    const groupSection = await groupsPage.openGroupCollapsible(
      daycareGroupFixture.id
    )
    const diaryPage = await groupSection.openDiary()

    await diaryPage.fillStaffAttendance(0, 3)

    // Change to another page and back to reload data
    await unitPage.openGroupsPage()
    await groupSection.openDiary()

    await diaryPage.assertStaffAttendance(0, 3)
  })
})