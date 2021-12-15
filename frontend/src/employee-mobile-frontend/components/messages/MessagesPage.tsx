// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useCallback, useContext } from 'react'
import { useTranslation } from '../../state/i18n'
import { useHistory, useParams } from 'react-router-dom'
import { UUID } from 'lib-common/types'
import { GroupInfo } from 'lib-common/generated/api-types/attendance'
import { renderResult } from '../async-rendering'
import { H1 } from 'lib-components/typography'
import { MessageContext } from '../../state/messages'
import BottomNavBar from '../common/BottomNavbar'
import { ContentArea } from 'lib-components/layout/Container'
import { ThreadView } from './ThreadView'
import { MessagePreview } from './MessagePreview'
import TopBarWithGroupSelector from '../common/TopBarWithGroupSelector'
import colors from 'lib-customizations/common'
import EmptyMessageFolder from 'lib-components/employee/messages/EmptyMessageFolder'
import styled from 'styled-components'
import { defaultMargins } from 'lib-components/white-space'

export default function MessagesPage() {
  const history = useHistory()
  const { unitId, groupId } = useParams<{
    unitId: UUID
    groupId: UUID | 'all'
  }>()

  function changeGroup(group: GroupInfo | undefined) {
    if (group) history.push(`/units/${unitId}/groups/${group.id}/messages`)
  }

  const {
    groupAccounts,
    receivedMessages,
    selectedThread,
    selectThread,
    selectedAccount
  } = useContext(MessageContext)

  const selectedGroup =
    groupAccounts.find(({ daycareGroup }) => daycareGroup?.id === groupId) ??
    groupAccounts[0]

  const { i18n } = useTranslation()
  const onBack = useCallback(() => selectThread(undefined), [selectThread])

  return selectedThread && selectedAccount ? (
    <ContentArea
      opaque
      fullHeight
      paddingHorizontal={'zero'}
      paddingVertical={'zero'}
      data-qa={`messages-page-content-area`}
    >
      <ThreadView
        thread={selectedThread}
        onBack={onBack}
        senderAccountId={selectedAccount.id}
      />
    </ContentArea>
  ) : !selectedThread && selectedAccount ? (
    <>
      <TopBarWithGroupSelector
        selectedGroup={
          selectedGroup?.daycareGroup
            ? {
                id: selectedGroup.daycareGroup.id,
                name: selectedGroup.daycareGroup.name
              }
            : undefined
        }
        onChangeGroup={changeGroup}
        allowedGroupIds={groupAccounts.flatMap(
          (ga) => ga.daycareGroup?.id || []
        )}
        includeSelectAll={false}
      />
      {renderResult(receivedMessages, (messages) => (
        <ContentArea
          opaque
          paddingVertical={'zero'}
          paddingHorizontal={'zero'}
          data-qa={`messages-page-content-area`}
        >
          <HeaderContainer>
            <H1 noMargin={true}>{i18n.messages.title}</H1>
          </HeaderContainer>
          {messages.length > 0 ? (
            messages.map((thread) => (
              <MessagePreview
                thread={thread}
                hasUnreadMessages={thread.messages.some(
                  (item) =>
                    !item.readAt &&
                    item.sender.id !== selectedAccount?.id &&
                    !groupAccounts.some(
                      (ga) => ga.account.id === item.sender.id
                    )
                )}
                onClick={() => {
                  selectThread(thread)
                }}
                key={thread.id}
              />
            ))
          ) : (
            <EmptyMessageFolder
              loading={receivedMessages.isLoading}
              iconColor={colors.greyscale.medium}
              text={i18n.messages.emptyInbox}
            />
          )}
          <BottomNavBar selected="messages" />
        </ContentArea>
      ))}
    </>
  ) : null
}

export const HeaderContainer = styled.div`
  padding: ${defaultMargins.m} ${defaultMargins.s};
  border-bottom: 1px solid ${colors.greyscale.lighter};
`
