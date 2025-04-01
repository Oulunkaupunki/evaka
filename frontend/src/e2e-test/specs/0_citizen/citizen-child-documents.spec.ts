// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  DocumentContent,
  DocumentTemplateContent
} from 'lib-common/generated/api-types/document'
import { DocumentTemplateId } from 'lib-common/generated/api-types/shared'
import HelsinkiDateTime from 'lib-common/helsinki-date-time'
import { randomId } from 'lib-common/id-type'
import { UUID } from 'lib-common/types'

import {
  createDaycarePlacementFixture,
  testDaycareGroup,
  Fixture,
  testAdult,
  testChild,
  testCareArea,
  testDaycare
} from '../../dev-api/fixtures'
import {
  createDaycareGroups,
  createDaycarePlacements,
  insertGuardians,
  resetServiceState
} from '../../generated/api-clients'
import { DevPerson } from '../../generated/api-types'
import { CitizenChildPage } from '../../pages/citizen/citizen-children'
import CitizenHeader from '../../pages/citizen/citizen-header'
import { ChildDocumentPage } from '../../pages/employee/documents/child-document'
import { Page } from '../../utils/page'
import { enduserLogin } from '../../utils/user'

let page: Page
let child: DevPerson
let templateIdVasu: DocumentTemplateId
let documentIdVasu: UUID
let templateIdHojks: DocumentTemplateId
let documentIdHojks: UUID
let templateIdPed: DocumentTemplateId
let documentIdPed: UUID
let header: CitizenHeader

const mockedNow = HelsinkiDateTime.of(2022, 7, 31, 13, 0)

beforeEach(async () => {
  await resetServiceState()

  await Fixture.careArea(testCareArea).save()
  await Fixture.daycare(testDaycare).save()
  await Fixture.family({ guardian: testAdult, children: [testChild] }).save()
  await createDaycareGroups({ body: [testDaycareGroup] })

  const unitId = testDaycare.id
  child = testChild
  await insertGuardians({
    body: [
      {
        guardianId: testAdult.id,
        childId: child.id
      }
    ]
  })

  await createDaycarePlacements({
    body: [createDaycarePlacementFixture(randomId(), child.id, unitId)]
  })

  templateIdVasu = (
    await Fixture.documentTemplate({
      type: 'VASU',
      name: 'VASU 2023-2024'
    })
      .withPublished(true)
      .save()
  ).id
  documentIdVasu = (
    await Fixture.childDocument({
      childId: child.id,
      templateId: templateIdVasu
    })
      .withPublishedAt(mockedNow)
      .withPublishedContent({
        answers: [
          {
            questionId: 'q1',
            type: 'TEXT',
            answer: 'test'
          }
        ]
      })
      .save()
  ).id

  templateIdHojks = (
    await Fixture.documentTemplate({
      type: 'HOJKS',
      name: 'HOJKS 2023-2024'
    })
      .withPublished(true)
      .save()
  ).id
  documentIdHojks = (
    await Fixture.childDocument({
      childId: child.id,
      templateId: templateIdHojks
    })
      .withPublishedAt(mockedNow)
      .withPublishedContent({
        answers: [
          {
            questionId: 'q1',
            type: 'TEXT',
            answer: 'test'
          }
        ]
      })
      .save()
  ).id

  templateIdPed = (
    await Fixture.documentTemplate({
      type: 'PEDAGOGICAL_REPORT',
      name: 'Pedagoginen selvitys'
    })
      .withPublished(true)
      .save()
  ).id
  documentIdPed = (
    await Fixture.childDocument({
      templateId: templateIdPed,
      childId: child.id
    })
      .withModifiedAt(mockedNow)
      .withPublishedAt(mockedNow)
      .withPublishedContent({
        answers: [
          {
            questionId: 'q1',
            type: 'TEXT',
            answer: 'test'
          }
        ]
      })
      .save()
  ).id

  page = await Page.open({ mockedTime: mockedNow })
  header = new CitizenHeader(page, 'desktop')
  await enduserLogin(page, testAdult)
})

describe('Citizen child documents listing page', () => {
  test('Published vasu is in the list', async () => {
    await header.openChildPage(child.id)
    const childPage = new CitizenChildPage(page)
    await childPage.openCollapsible('child-documents')
    await childPage.childDocumentLink(documentIdVasu).click()
    expect(page.url.endsWith(`/child-documents/${documentIdVasu}`)).toBeTruthy()
    await page.find('h1').assertTextEquals('VASU 2023-2024')
  })

  test('Published hojks is in the list', async () => {
    await header.openChildPage(child.id)
    const childPage = new CitizenChildPage(page)
    await childPage.openCollapsible('child-documents')
    await childPage.childDocumentLink(documentIdHojks).click()
    expect(
      page.url.endsWith(`/child-documents/${documentIdHojks}`)
    ).toBeTruthy()
    await page.find('h1').assertTextEquals('HOJKS 2023-2024')
  })

  test('Published pedagogical report is in the list', async () => {
    await header.openChildPage(child.id)
    const childPage = new CitizenChildPage(page)
    await childPage.openCollapsible('child-documents')
    await childPage.childDocumentLink(documentIdPed).click()
    expect(page.url.endsWith(`/child-documents/${documentIdPed}`)).toBeTruthy()
    await page.find('h1').assertTextEquals('Pedagoginen selvitys')
  })
})

describe('Citizen child documents editor page', () => {
  test('guardian can fill document and send', async () => {
    const templateContent: DocumentTemplateContent = {
      sections: [
        {
          id: randomId(),
          infoText: '',
          label: 'Testi',
          questions: [
            {
              id: randomId(),
              type: 'TEXT',
              infoText: '',
              label: 'Kysymys 1',
              multiline: false
            },
            {
              id: randomId(),
              type: 'TEXT',
              infoText: '',
              label: 'Kysymys 2',
              multiline: false
            }
          ]
        }
      ]
    }
    const template = await Fixture.documentTemplate({
      type: 'CITIZEN_BASIC',
      name: 'Lomake kuntalaiselle',
      content: templateContent,
      published: true
    }).save()
    const documentContent: DocumentContent = {
      answers: []
    }
    const document = await Fixture.childDocument({
      templateId: template.id,
      childId: child.id,
      status: 'CITIZEN_DRAFT',
      content: documentContent,
      publishedAt: mockedNow,
      publishedContent: documentContent
    }).save()

    await header.openChildPage(child.id)
    const childPage = new CitizenChildPage(page)
    await childPage.openCollapsible('child-documents')
    const row = childPage.childDocumentRow(document.id)
    await row.assertTextEquals(
      `${mockedNow.toLocalDate().format()}\tLomake kuntalaiselle\tEi vastattu\tTäytettävänä huoltajalla`
    )
    await childPage.childDocumentLink(document.id).click()
    const childDocumentPage = new ChildDocumentPage(page)
    await childDocumentPage.editButton.click()
    await childDocumentPage.status.assertTextEquals('Täytettävänä huoltajalla')
    const question1 = childDocumentPage.getTextQuestion('Testi', 'Kysymys 1')
    await question1.fill('Jonkin sortin vastaus 1')
    const question2 = childDocumentPage.getTextQuestion('Testi', 'Kysymys 2')
    await question2.fill('Jonkin sortin vastaus 2')
    await childDocumentPage.savingIndicator.waitUntilHidden()
    await childDocumentPage.previewButton.click()
    const answer1 = childDocumentPage.getTextAnswer('Testi', 'Kysymys 1')
    await answer1.assertTextEquals('Jonkin sortin vastaus 1\n')
    const answer2 = childDocumentPage.getTextAnswer('Testi', 'Kysymys 2')
    await answer2.assertTextEquals('Jonkin sortin vastaus 2\n')
    await childDocumentPage.sendButton.click()
    await childDocumentPage.status.assertTextEquals('Valmis')
    await childDocumentPage.returnButton.click()
    await childPage.openCollapsible('child-documents')
    await row.assertTextEquals(
      `${mockedNow.toLocalDate().format()}\tLomake kuntalaiselle\tVastattu, ${mockedNow.toLocalDate().format()}, ${testAdult.lastName} ${testAdult.firstName}\tValmis`
    )
  })
})
