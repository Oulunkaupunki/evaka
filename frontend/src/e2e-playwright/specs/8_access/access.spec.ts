// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { newBrowserContext } from '../../browser'
import config from 'e2e-test-common/config'
import { Page } from 'playwright'
import {
  AreaAndPersonFixtures,
  initializeAreaAndPersonData
} from 'e2e-test-common/dev-api/data-init'
import EmployeeNav from 'e2e-playwright/pages/employee/employee-nav'
import ChildInformationPage from 'e2e-playwright/pages/employee/child-information-page'
import {
  insertDaycarePlacementFixtures,
  insertEmployeeFixture,
  resetDatabase,
  setAclForDaycares
} from 'e2e-test-common/dev-api'
import { employeeLogin, employeeLoginKeyCloak } from 'e2e-playwright/utils/user'
import {
  createDaycarePlacementFixture,
  uuidv4
} from 'e2e-test-common/dev-api/fixtures'

let fixtures: AreaAndPersonFixtures
let page: Page
let nav: EmployeeNav
let childInfo: ChildInformationPage

beforeAll(async () => {
  await resetDatabase()
  fixtures = await initializeAreaAndPersonData()
  await insertEmployeeFixture({
    id: config.serviceWorkerAad,
    externalId: `espoo-ad:${config.serviceWorkerAad}`,
    email: 'paula.palveluohjaaja@evaka.test',
    firstName: 'Paula',
    lastName: 'Palveluohjaaja',
    roles: ['SERVICE_WORKER']
  })
  await insertEmployeeFixture({
    id: config.financeAdminAad,
    externalId: `espoo-ad:${config.financeAdminAad}`,
    email: 'lasse.laskuttaja@evaka.test',
    firstName: 'Lasse',
    lastName: 'Laskuttaja',
    roles: ['FINANCE_ADMIN']
  })
  await insertEmployeeFixture({
    id: config.directorAad,
    externalId: `espoo-ad:${config.directorAad}`,
    email: 'raisa.raportoija@evaka.test',
    firstName: 'Raisa',
    lastName: 'Raportoija',
    roles: ['DIRECTOR']
  })
  await insertEmployeeFixture({
    id: config.unitSupervisorAad,
    externalId: `espoo-ad:${config.unitSupervisorAad}`,
    email: 'essi.esimies@evaka.test',
    firstName: 'Essi',
    lastName: 'Esimies',
    roles: []
  })
  await setAclForDaycares(
    `espoo-ad:${config.unitSupervisorAad}`,
    fixtures.daycareFixture.id
  )
  await insertEmployeeFixture({
    id: config.staffAad,
    externalId: `espoo-ad:${config.staffAad}`,
    email: 'kaisa.kasvattaja@evaka.test',
    firstName: 'Kaisa',
    lastName: 'Kasvattaja',
    roles: []
  })
  await setAclForDaycares(
    `espoo-ad:${config.staffAad}`,
    fixtures.daycareFixture.id,
    'STAFF'
  )
  await insertEmployeeFixture({
    id: config.specialEducationTeacher,
    externalId: `espoo-ad:${config.specialEducationTeacher}`,
    email: 'erkki.erityisopettaja@evaka.test',
    firstName: 'Erkki',
    lastName: 'Erityisopettaja',
    roles: []
  })
  await setAclForDaycares(
    `espoo-ad:${config.specialEducationTeacher}`,
    fixtures.daycareFixture.id,
    'SPECIAL_EDUCATION_TEACHER'
  )
  const placementFixture = createDaycarePlacementFixture(
    uuidv4(),
    fixtures.enduserChildFixtureJari.id,
    fixtures.daycareFixture.id
  )
  await insertDaycarePlacementFixtures([placementFixture])
})
beforeEach(async () => {
  page = await (await newBrowserContext()).newPage()
  nav = new EmployeeNav(page)
  childInfo = new ChildInformationPage(page)
})
afterEach(async () => {
  await page.close()
})

describe('Child information page', () => {
  test('Admin sees every tab, except messaging', async () => {
    await employeeLogin(page, 'ADMIN')
    await page.goto(config.employeeUrl)
    await nav.tabsVisible({
      applications: true,
      units: true,
      search: true,
      finance: true,
      reports: true,
      messages: false
    })
  })

  test('Service worker sees applications, units, search and reports tabs', async () => {
    await employeeLogin(page, 'SERVICE_WORKER')
    await page.goto(config.employeeUrl)
    await nav.tabsVisible({
      applications: true,
      units: true,
      search: true,
      finance: false,
      reports: true,
      messages: false
    })
  })

  test('FinanceAdmin sees units, search, finance and reports tabs', async () => {
    await employeeLogin(page, 'FINANCE_ADMIN')
    await page.goto(config.employeeUrl)
    await nav.tabsVisible({
      applications: false,
      units: true,
      search: true,
      finance: true,
      reports: true,
      messages: false
    })
  })

  test('Director sees only the reports tab', async () => {
    await employeeLogin(page, 'DIRECTOR')
    await page.goto(config.employeeUrl)
    await nav.tabsVisible({
      applications: false,
      units: false,
      search: false,
      finance: false,
      reports: true,
      messages: false
    })
  })

  test('Staff sees only the units and messaging tabs', async () => {
    await employeeLogin(page, 'STAFF')
    await page.goto(config.employeeUrl)
    await nav.tabsVisible({
      applications: false,
      units: true,
      search: false,
      finance: false,
      reports: false,
      messages: true
    })
  })

  test('Unit supervisor sees units, search, reports and messaging tabs', async () => {
    await employeeLogin(page, 'UNIT_SUPERVISOR')
    await page.goto(config.employeeUrl)
    await nav.tabsVisible({
      applications: false,
      units: true,
      search: true,
      finance: false,
      reports: true,
      messages: true
    })
  })
})

describe('Child information page sections', () => {
  test('Admin sees every collapsible section', async () => {
    await employeeLogin(page, 'ADMIN')
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.childCollapsiblesVisible({
      feeAlterations: true,
      guardiansAndParents: true,
      placements: true,
      assistance: true,
      backupCare: true,
      familyContacts: true,
      childApplications: true,
      messageBlocklist: true
    })
  })

  test('Service worker sees the correct sections', async () => {
    await employeeLogin(page, 'SERVICE_WORKER')
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.childCollapsiblesVisible({
      feeAlterations: false,
      guardiansAndParents: true,
      placements: true,
      assistance: true,
      backupCare: true,
      familyContacts: false,
      childApplications: true,
      messageBlocklist: false
    })
  })

  test('Finance admin sees the correct sections', async () => {
    await employeeLogin(page, 'FINANCE_ADMIN')
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.childCollapsiblesVisible({
      feeAlterations: true,
      guardiansAndParents: true,
      placements: true,
      assistance: false,
      backupCare: true,
      familyContacts: false,
      childApplications: false,
      messageBlocklist: false
    })
  })

  test('Staff sees the correct sections', async () => {
    await employeeLogin(page, 'STAFF')
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.childCollapsiblesVisible({
      feeAlterations: false,
      guardiansAndParents: false,
      placements: true,
      assistance: false,
      backupCare: true,
      familyContacts: true,
      childApplications: false,
      messageBlocklist: false
    })
  })

  test('Unit supervisor sees the correct sections', async () => {
    await employeeLogin(page, 'UNIT_SUPERVISOR')
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.childCollapsiblesVisible({
      feeAlterations: false,
      guardiansAndParents: true,
      placements: true,
      assistance: true,
      backupCare: true,
      familyContacts: true,
      childApplications: false,
      messageBlocklist: false
    })
  })

  test('Special education teacher sees the correct sections', async () => {
    await employeeLogin(page, 'SPECIAL_EDUCATION_TEACHER')
    await page.goto(
      `${config.employeeUrl}/child-information/${fixtures.enduserChildFixtureJari.id}`
    )
    await childInfo.childCollapsiblesVisible({
      feeAlterations: false,
      guardiansAndParents: false,
      placements: true,
      assistance: true,
      backupCare: true,
      familyContacts: true,
      childApplications: false,
      messageBlocklist: false
    })
  })
})

describe('SAML login', () => {
  test('Login', async () => {
    await employeeLoginKeyCloak(page)
  })
})
