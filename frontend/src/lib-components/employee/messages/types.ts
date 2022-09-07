// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  Group,
  MessageReceiver,
  AuthorizedMessageAccount,
  UpdatableDraftContent
} from 'lib-common/generated/api-types/messaging'
import { JsonOf } from 'lib-common/json'
import LocalDate from 'lib-common/local-date'
import { UUID } from 'lib-common/types'

export interface GroupMessageAccount extends AuthorizedMessageAccount {
  daycareGroup: Group
}

export const isGroupMessageAccount = (
  acc: AuthorizedMessageAccount
): acc is GroupMessageAccount =>
  acc.account.type === 'GROUP' && acc.daycareGroup !== null

export interface SaveDraftParams {
  accountId: UUID
  draftId: UUID
  content: UpdatableDraftContent
}

export const deserializeReceiver = (
  json: JsonOf<MessageReceiver>
): MessageReceiver => ({
  ...json,
  childDateOfBirth: LocalDate.parseIso(json.childDateOfBirth)
})