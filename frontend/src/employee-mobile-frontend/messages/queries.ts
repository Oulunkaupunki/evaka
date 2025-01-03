// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  DaycareId,
  MessageAccountId
} from 'lib-common/generated/api-types/shared'
import { mutation, pagedInfiniteQuery, query } from 'lib-common/query'
import { Arg0, UUID } from 'lib-common/types'

import {
  createMessage,
  createMessagePreflightCheck,
  deleteDraftMessage,
  getAccountsByDevice,
  getDraftMessages,
  getReceivedMessages,
  getReceiversForNewMessage,
  getSentMessages,
  getThread,
  getUnreadMessagesByUnit,
  initDraftMessage,
  markThreadRead,
  replyToThread,
  updateDraftMessage
} from '../generated/api-clients/messaging'
import { createQueryKeys } from '../query'

const queryKeys = createQueryKeys('messages', {
  accounts: ({
    unitId,
    employeeId
  }: {
    unitId: string
    employeeId: string | undefined
  }) => ['accounts', unitId, employeeId],
  receivedMessages: (accountId: string) => ['receivedMessages', accountId],
  sentMessages: (accountId: string) => ['sentMessages', accountId],
  draftMessages: (accountId: string) => ['draftMessages', accountId],
  thread: (accountId: string, threadId: string) => [
    'thread',
    accountId,
    threadId
  ],
  recipients: () => ['recipients'],
  unreadCounts: () => ['unreadCounts'],
  preflight: (arg: Arg0<typeof createMessagePreflightCheck>) => [
    'preflight',
    arg
  ]
})

export const messagingAccountsQuery = query({
  // employeeId is not sent to api but is used to invalidate the query when it changes, so that there's no risk of
  // leaking account information from the previous logged-in employee
  api: ({ unitId }: { unitId: DaycareId; employeeId: string | undefined }) =>
    getAccountsByDevice({ unitId }),
  queryKey: queryKeys.accounts
})

export const receivedMessagesQuery = pagedInfiniteQuery({
  api: (accountId: MessageAccountId) => (page: number) =>
    getReceivedMessages({ accountId, page }),
  id: (thread) => thread.id,
  queryKey: queryKeys.receivedMessages
})

export const sentMessagesQuery = pagedInfiniteQuery({
  api: (accountId: MessageAccountId) => (page: number) =>
    getSentMessages({ accountId, page }),
  id: (message) => message.contentId,
  queryKey: queryKeys.sentMessages
})

export const draftMessagesQuery = query({
  api: getDraftMessages,
  queryKey: ({ accountId }) => queryKeys.draftMessages(accountId)
})

export const threadQuery = query({
  api: getThread,
  queryKey: ({ accountId, threadId }) => queryKeys.thread(accountId, threadId)
})

// The results are dependent on the PIN-logged user
export const recipientsQuery = query({
  api: getReceiversForNewMessage,
  queryKey: queryKeys.recipients
})

export const unreadCountsQuery = query({
  api: getUnreadMessagesByUnit,
  queryKey: queryKeys.unreadCounts
})

export const createMessagePreflightCheckQuery = query({
  api: createMessagePreflightCheck,
  queryKey: queryKeys.preflight
})

export const sendMessageMutation = mutation({
  api: createMessage,
  invalidateQueryKeys: ({ accountId }) => [
    queryKeys.sentMessages(accountId),
    queryKeys.draftMessages(accountId)
  ]
})

export const replyToThreadMutation = mutation({
  api: (arg: Arg0<typeof replyToThread> & { threadId: UUID }) =>
    replyToThread(arg),
  invalidateQueryKeys: ({ accountId, threadId }) => [
    queryKeys.receivedMessages(accountId),
    queryKeys.thread(accountId, threadId)
  ]
})

export const markThreadReadMutation = mutation({
  api: markThreadRead,
  invalidateQueryKeys: () => [queryKeys.unreadCounts()]
})

export const initDraftMutation = mutation({
  api: initDraftMessage,
  invalidateQueryKeys: ({ accountId }) => [queryKeys.draftMessages(accountId)]
})

export const saveDraftMutation = mutation({
  api: updateDraftMessage,
  invalidateQueryKeys: ({ accountId }) => [queryKeys.draftMessages(accountId)]
})

export const deleteDraftMutation = mutation({
  api: deleteDraftMessage,
  invalidateQueryKeys: ({ accountId }) => [queryKeys.draftMessages(accountId)]
})
