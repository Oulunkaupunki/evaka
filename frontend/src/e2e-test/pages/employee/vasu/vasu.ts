// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { waitUntilEqual, waitUntilTrue } from '../../../utils'
import { Page, TextInput, Element, Checkbox } from '../../../utils/page'

import {
  AdditionalInfoSection,
  AuthorsSection,
  ConsiderationsSection,
  DiscussionSection,
  EvaluationSection,
  GoalsSection,
  InfoSharedToSection,
  OtherDocsAndPlansSection,
  PreviousVasuGoalsSection,
  SpecialSupportSection,
  WellnessSupportSection
} from './pageSections'

class VasuPageCommon {
  constructor(readonly page: Page) {}

  readonly #documentSection = this.page.findAll(
    '[data-qa="vasu-document-section"]'
  )
  readonly #followupQuestions = this.page.findAll(
    '[data-qa="vasu-followup-question"]'
  )

  getDocumentSection(ix: number): Element {
    // Note: indexes might change if the template used in the test changes
    return this.#documentSection.nth(ix)
  }

  async assertDocumentVisible() {
    await this.#documentSection.first().waitUntilVisible()
  }

  get authorsSection(): AuthorsSection {
    return new AuthorsSection(this.getDocumentSection(0))
  }

  get considerationsSection(): ConsiderationsSection {
    return new ConsiderationsSection(this.getDocumentSection(1))
  }

  get previousVasuGoalsSection(): PreviousVasuGoalsSection {
    return new PreviousVasuGoalsSection(this.getDocumentSection(2))
  }

  get goalsSection(): GoalsSection {
    return new GoalsSection(this.getDocumentSection(3))
  }

  get specialSupportSection(): SpecialSupportSection {
    return new SpecialSupportSection(this.getDocumentSection(4))
  }

  get wellnessSupportSection(): WellnessSupportSection {
    return new WellnessSupportSection(this.getDocumentSection(5))
  }

  get otherDocsAndPlansSection(): OtherDocsAndPlansSection {
    return new OtherDocsAndPlansSection(this.getDocumentSection(6))
  }

  get infoSharedToSection(): InfoSharedToSection {
    return new InfoSharedToSection(this.getDocumentSection(7))
  }

  get additionalInfoSection(): AdditionalInfoSection {
    return new AdditionalInfoSection(this.getDocumentSection(8))
  }

  get discussionSection(): DiscussionSection {
    return new DiscussionSection(this.getDocumentSection(9))
  }

  get evaluationSection(): EvaluationSection {
    return new EvaluationSection(this.getDocumentSection(10))
  }

  get followupQuestionCount(): Promise<number> {
    return this.#followupQuestions.count()
  }
}

export class VasuEditPage extends VasuPageCommon {
  readonly modalOkButton = this.page.find('[data-qa="modal-okBtn"]')

  #followup(nth: number) {
    const question = this.page
      .findAllByDataQa('vasu-followup-question')
      .nth(nth)
    return {
      newInput: new TextInput(
        question.findByDataQa('vasu-followup-entry-new-input')
      ),
      newSubmit: question.findByDataQa('vasu-followup-entry-new-submit'),
      entryTexts: question.findAllByDataQa('vasu-followup-entry-text'),
      entryMetadatas: question.findAllByDataQa('vasu-followup-entry-metadata'),
      entryEditButtons: question.findAllByDataQa(
        'vasu-followup-entry-edit-btn'
      ),
      entryInput: new TextInput(
        question.findByDataQa('vasu-followup-entry-edit-input')
      ),
      entrySaveButton: question.findByDataQa('vasu-followup-entry-edit-submit')
    }
  }

  readonly #vasuPreviewBtn = this.page.find('[data-qa="vasu-preview-btn"]')
  readonly #vasuContainer = this.page.find('[data-qa="vasu-container"]')

  readonly #multiSelectQuestionOption = (text: string) =>
    this.page.find(`[data-qa="multi-select-question-option-${text}"]`)
  readonly #multiSelectQuestionOptionTextInput = (text: string) =>
    new TextInput(
      this.page.find(
        `[data-qa="multi-select-question-option-text-input-${text}"]`
      )
    )

  async clickMultiSelectQuestionOption(key: string) {
    await this.#multiSelectQuestionOption(key).click()
  }

  async setMultiSelectQuestionOptionText(key: string, text: string) {
    await this.#multiSelectQuestionOptionTextInput(key).fill(text)
  }

  async inputFollowupComment(comment: string, nth: number) {
    await this.#followup(nth).newInput.type(comment)
    await this.#followup(nth).newSubmit.click()
  }

  followupEntryTexts(nth: number): Promise<Array<string>> {
    return this.#followup(nth).entryTexts.allInnerTexts()
  }

  followupEntryMetadata(nth: number): Promise<Array<string>> {
    return this.#followup(nth).entryMetadatas.allInnerTexts()
  }

  async editFollowupComment(ix: number, text: string, nth: number) {
    await this.#followup(nth).entryEditButtons.nth(ix).click()
    await this.#followup(nth).entryInput.type(text)
    await this.#followup(nth).entrySaveButton.click()
  }

  get previewBtn(): Element {
    return this.#vasuPreviewBtn
  }

  async waitUntilSaved(): Promise<void> {
    await waitUntilEqual(
      () => this.#vasuContainer.getAttribute('data-status'),
      'clean'
    )
  }
}

export class VasuPage extends VasuPageCommon {
  readonly finalizeButton = this.page.find(
    '[data-qa="transition-button-MOVED_TO_READY"]'
  )
  readonly markReviewedButton = this.page.find(
    '[data-qa="transition-button-MOVED_TO_REVIEWED"]'
  )
  readonly markClosedButton = this.page.find(
    '[data-qa="transition-button-MOVED_TO_CLOSED"]'
  )
  readonly modalOkButton = this.page.find('[data-qa="modal-okBtn"]')
  readonly #vasuEventListLabels = this.page.findAll(
    '[data-qa="vasu-event-list"] label'
  )
  readonly #vasuEventListValues = this.page.findAll(
    '[data-qa="vasu-event-list"] span'
  )
  readonly #vasuEventListDocState = this.page.find(
    '[data-qa="vasu-event-list"] [data-qa="vasu-state-chip"]'
  )

  readonly #templateName = this.page.find('[data-qa="template-name"]')
  readonly #editButton = this.page.find('[data-qa="edit-button"]')

  documentState = () => this.#vasuEventListDocState.innerText

  // The (first) label for the state chip has no corresponding span, so the index is off by one.
  #valueForLabel = (label: string): Promise<string> =>
    this.#vasuEventListLabels
      .allInnerTexts()
      .then((labels) =>
        labels.reduce(
          async (acc, l, ix) =>
            l === label
              ? await this.#vasuEventListValues.nth(ix - 1).innerText
              : acc,
          Promise.resolve('')
        )
      )

  publishedToGuardiansDate = () =>
    this.#valueForLabel('Viimeksi julkaistu huoltajalle')
  publishedDate = () => this.#valueForLabel('Julkaistu Laadittu-tilaan')
  reviewedDate = () => this.#valueForLabel('Julkaistu Arvioitu-tilaan')
  closedDate = () => this.#valueForLabel('Päättynyt')

  async assertTemplateName(expected: string) {
    await waitUntilEqual(() => this.#templateName.textContent, expected)
  }

  async edit() {
    await this.#editButton.click()
  }
}

export class VasuPreviewPage extends VasuPageCommon {
  readonly #multiselectAnswer = (questionNumber: string) =>
    this.page.find(`[data-qa="value-or-no-record-${questionNumber}"]`)

  readonly #titleChildName = this.page.findByDataQa('title-child-name')
  readonly #confirmCheckBox = new Checkbox(
    this.page.findByDataQa('confirm-checkbox')
  )
  readonly #confirmButton = this.page.findByDataQa('confirm-button')

  async assertTitleChildName(expectedName: string) {
    await waitUntilEqual(() => this.#titleChildName.textContent, expectedName)
  }

  async assertGivePermissionToShareSectionIsVisible() {
    await this.#confirmButton.waitUntilVisible()
  }

  async assertGivePermissionToShareSectionIsNotVisible() {
    await this.#titleChildName.waitUntilVisible()
    await this.#confirmButton.waitUntilHidden()
  }

  async givePermissionToShare() {
    await this.#confirmCheckBox.check()
    await this.#confirmButton.click()
  }

  async assertMultiSelectContains(
    questionNumber: string,
    expectedText: string
  ) {
    await waitUntilTrue(async () =>
      (
        await this.#multiselectAnswer(questionNumber).innerText
      ).includes(expectedText)
    )
  }
}
