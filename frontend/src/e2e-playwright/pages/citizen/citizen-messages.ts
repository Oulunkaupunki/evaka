// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { waitUntilEqual } from 'e2e-playwright/utils'
import { RawElement, RawTextInput } from 'e2e-playwright/utils/element'
import { Page } from 'playwright'

export default class CitizenMessagesPage {
  constructor(private readonly page: Page) {}

  #messageReplyContent = new RawTextInput(
    this.page,
    '[data-qa="message-reply-content"]'
  )
  #threadListItem = new RawElement(this.page, '[data-qa="thread-list-item"]')
  #threadTitle = new RawElement(this.page, '[data-qa="thread-reader-title"]')
  #threadContent = new RawElement(
    this.page,
    '[data-qa="thread-reader-content"]'
  )
  #sendReplyButton = new RawElement(this.page, '[data-qa="message-send-btn"]')

  async getMessageCount() {
    return this.page.$$eval(
      '[data-qa="thread-reader-content"]',
      (messages) => messages.length
    )
  }

  async assertThreadContent(title: string, content: string) {
    await this.#threadListItem.click()
    await waitUntilEqual(() => this.#threadTitle.innerText, title)
    await waitUntilEqual(() => this.#threadContent.innerText, content)
  }

  async replyToFirstThread(content: string) {
    await this.#threadListItem.click()
    await this.#messageReplyContent.fill(content)
    await this.#sendReplyButton.click()
  }
}
