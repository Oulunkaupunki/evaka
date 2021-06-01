// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import InlineButton from 'lib-components/atoms/buttons/InlineButton'
import { ContentArea } from 'lib-components/layout/Container'
import { MessageReplyEditor } from 'lib-components/molecules/MessageReplyEditor'
import { H2 } from 'lib-components/typography'
import { defaultMargins, Gap } from 'lib-components/white-space'
import colors from 'lib-customizations/common'
import { faAngleLeft } from 'lib-icons'
import React, { useCallback, useContext, useMemo } from 'react'
import styled from 'styled-components'
import { DATE_FORMAT_DATE_TIME } from '../../constants'
import { useTranslation } from '../../state/i18n'
import { UUID } from '../../types'
import { formatDate } from '../../utils/date'
import { MessagesPageContext } from './MessagesPageContext'
import { MessageTypeChip } from './MessageTypeChip'
import { Message, MessageThread, MessageType } from './types'

const MessageContainer = styled.div`
  background-color: white;
  padding: ${defaultMargins.L};

  & + & {
    margin-top: ${defaultMargins.s};
  }

  h2 {
    margin: 0;
  }
`

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  & + & {
    margin-top: ${defaultMargins.L};
  }
`
const SenderName = styled.div`
  font-weight: 600;
`
const SentDate = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.greyscale.dark};
`
const MessageContent = styled.div`
  padding-top: ${defaultMargins.s};
  white-space: pre-line;
`

function Message({
  title,
  type,
  message
}: {
  message: Message
  type?: MessageType
  title?: string
}) {
  return (
    <MessageContainer>
      {title && type && (
        <TitleRow>
          <H2>{title}</H2> <MessageTypeChip type={type} />
        </TitleRow>
      )}
      <TitleRow>
        <SenderName>{message.senderName}</SenderName>
        <SentDate>{formatDate(message.sentAt, DATE_FORMAT_DATE_TIME)}</SentDate>
      </TitleRow>
      <MessageContent>{message.content}</MessageContent>
    </MessageContainer>
  )
}

const ThreadContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`
const ScrollContainer = styled.div`
  overflow-y: auto;
`

interface Props {
  accountId: UUID
  goBack: () => void
  thread: MessageThread
}

export function SingleThreadView({
  accountId,
  goBack,
  thread: { id: threadId, messages, title, type }
}: Props) {
  const { i18n } = useTranslation()
  const {
    getReplyContent,
    sendReply,
    replyState,
    setReplyContent
  } = useContext(MessagesPageContext)

  const replyContent = getReplyContent(threadId)
  const onUpdateContent = useCallback(
    (content) => setReplyContent(threadId, content),
    [setReplyContent, threadId]
  )

  const [messageId, recipients] = useMemo(() => {
    const message = messages.slice(-1)[0]
    return [
      message.id,
      [
        ...message.recipients.filter((r) => r.id !== accountId),
        ...(message.senderId !== accountId
          ? [{ id: message.senderId, name: message.senderName }]
          : [])
      ]
    ]
  }, [accountId, messages])

  const onSubmitReply = () =>
    sendReply({
      content: replyContent,
      messageId,
      recipientAccountIds: recipients.map((r) => r.id),
      accountId
    })

  const canReply = type === 'MESSAGE' || messages[0].senderId === accountId
  const editorLabels = useMemo(
    () => ({
      message: i18n.messages.messageEditor.message,
      recipients: i18n.messages.messageEditor.receivers,
      send: i18n.messages.messageEditor.send,
      sending: i18n.messages.messageEditor.sending
    }),
    [i18n]
  )
  return (
    <ThreadContainer>
      <ContentArea opaque>
        <InlineButton
          icon={faAngleLeft}
          text={i18n.common.goBack}
          onClick={goBack}
          color={colors.blues.primary}
        />
      </ContentArea>
      <Gap size="xs" />
      <ScrollContainer>
        {messages.map((message, idx) => (
          <Message
            key={message.id}
            message={message}
            title={idx === 0 ? title : undefined}
            type={idx === 0 ? type : undefined}
          />
        ))}
        {canReply && (
          <MessageContainer>
            <MessageReplyEditor
              recipients={recipients}
              replyContent={replyContent}
              onUpdateContent={onUpdateContent}
              i18n={editorLabels}
              onSubmit={onSubmitReply}
              replyState={replyState}
            />
          </MessageContainer>
        )}
      </ScrollContainer>
    </ThreadContainer>
  )
}
