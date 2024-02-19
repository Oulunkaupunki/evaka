// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications
/* eslint-disable import/order, prettier/prettier, @typescript-eslint/no-namespace, @typescript-eslint/no-redundant-type-constituents */

import { AuthorizedMessageAccount } from 'lib-common/generated/api-types/messaging'
import { DraftContent } from 'lib-common/generated/api-types/messaging'
import { EditRecipientRequest } from 'lib-common/generated/api-types/messaging'
import { JsonCompatible } from 'lib-common/json'
import { JsonOf } from 'lib-common/json'
import { MessageReceiversResponse } from 'lib-common/generated/api-types/messaging'
import { MessageThread } from 'lib-common/generated/api-types/messaging'
import { PagedMessageCopies } from 'lib-common/generated/api-types/messaging'
import { PagedMessageThreads } from 'lib-common/generated/api-types/messaging'
import { PagedSentMessages } from 'lib-common/generated/api-types/messaging'
import { PostMessageBody } from 'lib-common/generated/api-types/messaging'
import { Recipient } from 'lib-common/generated/api-types/messaging'
import { ReplyToMessageBody } from 'lib-common/generated/api-types/messaging'
import { ThreadReply } from 'lib-common/generated/api-types/messaging'
import { UUID } from 'lib-common/types'
import { UnreadCountByAccount } from 'lib-common/generated/api-types/messaging'
import { UnreadCountByAccountAndGroup } from 'lib-common/generated/api-types/messaging'
import { UpdatableDraftContent } from 'lib-common/generated/api-types/messaging'
import { client } from '../../api/client'
import { deserializeJsonDraftContent } from 'lib-common/generated/api-types/messaging'
import { deserializeJsonMessageThread } from 'lib-common/generated/api-types/messaging'
import { deserializeJsonPagedMessageCopies } from 'lib-common/generated/api-types/messaging'
import { deserializeJsonPagedMessageThreads } from 'lib-common/generated/api-types/messaging'
import { deserializeJsonPagedSentMessages } from 'lib-common/generated/api-types/messaging'
import { deserializeJsonThreadReply } from 'lib-common/generated/api-types/messaging'
import { uri } from 'lib-common/uri'


/**
* Generated from fi.espoo.evaka.messaging.ChildRecipientsController.editRecipient
*/
export async function editRecipient(
  request: {
    childId: UUID,
    personId: UUID,
    body: EditRecipientRequest
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/child/${request.childId}/recipients/${request.personId}`.toString(),
    method: 'PUT',
    data: request.body satisfies JsonCompatible<EditRecipientRequest>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.messaging.ChildRecipientsController.getRecipients
*/
export async function getRecipients(
  request: {
    childId: UUID
  }
): Promise<Recipient[]> {
  const { data: json } = await client.request<JsonOf<Recipient[]>>({
    url: uri`/child/${request.childId}/recipients`.toString(),
    method: 'GET'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.archiveThread
*/
export async function archiveThread(
  request: {
    accountId: UUID,
    threadId: UUID
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/messages/${request.accountId}/threads/${request.threadId}/archive`.toString(),
    method: 'PUT'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.createMessage
*/
export async function createMessage(
  request: {
    accountId: UUID,
    body: PostMessageBody
  }
): Promise<UUID | null> {
  const { data: json } = await client.request<JsonOf<UUID | null>>({
    url: uri`/messages/${request.accountId}`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<PostMessageBody>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.deleteDraft
*/
export async function deleteDraft(
  request: {
    accountId: UUID,
    draftId: UUID
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/messages/${request.accountId}/drafts/${request.draftId}`.toString(),
    method: 'DELETE'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.getAccountsByUser
*/
export async function getAccountsByUser(): Promise<AuthorizedMessageAccount[]> {
  const { data: json } = await client.request<JsonOf<AuthorizedMessageAccount[]>>({
    url: uri`/messages/my-accounts`.toString(),
    method: 'GET'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.getArchivedMessages
*/
export async function getArchivedMessages(
  request: {
    accountId: UUID,
    pageSize: number,
    page: number
  }
): Promise<PagedMessageThreads> {
  const { data: json } = await client.request<JsonOf<PagedMessageThreads>>({
    url: uri`/messages/${request.accountId}/archived`.toString(),
    method: 'GET',
    params: {
      pageSize: request.pageSize,
      page: request.page
    }
  })
  return deserializeJsonPagedMessageThreads(json)
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.getDrafts
*/
export async function getDrafts(
  request: {
    accountId: UUID
  }
): Promise<DraftContent[]> {
  const { data: json } = await client.request<JsonOf<DraftContent[]>>({
    url: uri`/messages/${request.accountId}/drafts`.toString(),
    method: 'GET'
  })
  return json.map(e => deserializeJsonDraftContent(e))
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.getMessageCopies
*/
export async function getMessageCopies(
  request: {
    accountId: UUID,
    pageSize: number,
    page: number
  }
): Promise<PagedMessageCopies> {
  const { data: json } = await client.request<JsonOf<PagedMessageCopies>>({
    url: uri`/messages/${request.accountId}/copies`.toString(),
    method: 'GET',
    params: {
      pageSize: request.pageSize,
      page: request.page
    }
  })
  return deserializeJsonPagedMessageCopies(json)
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.getReceivedMessages
*/
export async function getReceivedMessages(
  request: {
    accountId: UUID,
    pageSize: number,
    page: number
  }
): Promise<PagedMessageThreads> {
  const { data: json } = await client.request<JsonOf<PagedMessageThreads>>({
    url: uri`/messages/${request.accountId}/received`.toString(),
    method: 'GET',
    params: {
      pageSize: request.pageSize,
      page: request.page
    }
  })
  return deserializeJsonPagedMessageThreads(json)
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.getReceiversForNewMessage
*/
export async function getReceiversForNewMessage(): Promise<MessageReceiversResponse[]> {
  const { data: json } = await client.request<JsonOf<MessageReceiversResponse[]>>({
    url: uri`/messages/receivers`.toString(),
    method: 'GET'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.getSentMessages
*/
export async function getSentMessages(
  request: {
    accountId: UUID,
    pageSize: number,
    page: number
  }
): Promise<PagedSentMessages> {
  const { data: json } = await client.request<JsonOf<PagedSentMessages>>({
    url: uri`/messages/${request.accountId}/sent`.toString(),
    method: 'GET',
    params: {
      pageSize: request.pageSize,
      page: request.page
    }
  })
  return deserializeJsonPagedSentMessages(json)
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.getThread
*/
export async function getThread(
  request: {
    accountId: UUID,
    threadId: UUID
  }
): Promise<MessageThread> {
  const { data: json } = await client.request<JsonOf<MessageThread>>({
    url: uri`/messages/${request.accountId}/thread/${request.threadId}`.toString(),
    method: 'GET'
  })
  return deserializeJsonMessageThread(json)
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.getThreadByApplicationId
*/
export async function getThreadByApplicationId(
  request: {
    applicationId: UUID
  }
): Promise<MessageThread | null> {
  const { data: json } = await client.request<JsonOf<MessageThread | null>>({
    url: uri`/messages/application/${request.applicationId}`.toString(),
    method: 'GET'
  })
  return (json != null) ? deserializeJsonMessageThread(json) : null
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.getUnreadMessages
*/
export async function getUnreadMessages(): Promise<UnreadCountByAccount[]> {
  const { data: json } = await client.request<JsonOf<UnreadCountByAccount[]>>({
    url: uri`/messages/unread`.toString(),
    method: 'GET'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.getUnreadMessagesByUnit
*/
export async function getUnreadMessagesByUnit(
  request: {
    unitId: UUID
  }
): Promise<UnreadCountByAccountAndGroup[]> {
  const { data: json } = await client.request<JsonOf<UnreadCountByAccountAndGroup[]>>({
    url: uri`/messages/unread/${request.unitId}`.toString(),
    method: 'GET'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.initDraft
*/
export async function initDraft(
  request: {
    accountId: UUID
  }
): Promise<UUID> {
  const { data: json } = await client.request<JsonOf<UUID>>({
    url: uri`/messages/${request.accountId}/drafts`.toString(),
    method: 'POST'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.markThreadRead
*/
export async function markThreadRead(
  request: {
    accountId: UUID,
    threadId: UUID
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/messages/${request.accountId}/threads/${request.threadId}/read`.toString(),
    method: 'PUT'
  })
  return json
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.replyToThread
*/
export async function replyToThread(
  request: {
    accountId: UUID,
    messageId: UUID,
    body: ReplyToMessageBody
  }
): Promise<ThreadReply> {
  const { data: json } = await client.request<JsonOf<ThreadReply>>({
    url: uri`/messages/${request.accountId}/${request.messageId}/reply`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<ReplyToMessageBody>
  })
  return deserializeJsonThreadReply(json)
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.undoMessage
*/
export async function undoMessage(
  request: {
    accountId: UUID,
    contentId: UUID
  }
): Promise<UUID> {
  const { data: json } = await client.request<JsonOf<UUID>>({
    url: uri`/messages/${request.accountId}/undo-message`.toString(),
    method: 'POST',
    params: {
      contentId: request.contentId
    }
  })
  return json
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.undoReply
*/
export async function undoReply(
  request: {
    accountId: UUID,
    messageId: UUID
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/messages/${request.accountId}/undo-reply`.toString(),
    method: 'POST',
    params: {
      messageId: request.messageId
    }
  })
  return json
}


/**
* Generated from fi.espoo.evaka.messaging.MessageController.upsertDraft
*/
export async function upsertDraft(
  request: {
    accountId: UUID,
    draftId: UUID,
    body: UpdatableDraftContent
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/messages/${request.accountId}/drafts/${request.draftId}`.toString(),
    method: 'PUT',
    data: request.body satisfies JsonCompatible<UpdatableDraftContent>
  })
  return json
}