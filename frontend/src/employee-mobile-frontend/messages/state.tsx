// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'

import { AuthorizedMessageAccount } from 'lib-common/generated/api-types/messaging'
import { queryOrDefault, useQuery } from 'lib-common/query'
import { UUID } from 'lib-common/types'

import { UserContext } from '../auth/state'
import { UnitOrGroup } from '../common/unit-or-group'

import { messagingAccountsQuery } from './queries'

export interface MessagesState {
  groupAccounts: AuthorizedMessageAccount[]
  selectedAccount: AuthorizedMessageAccount | undefined
  setReplyContent: (threadId: UUID, content: string) => void
  getReplyContent: (threadId: UUID) => string
}

const defaultState: MessagesState = {
  groupAccounts: [],
  selectedAccount: undefined,
  getReplyContent: () => '',
  setReplyContent: () => undefined
}

export const MessageContext = createContext<MessagesState>(defaultState)

export const MessageContextProvider = React.memo(
  function MessageContextProvider({
    unitOrGroup,
    children
  }: {
    unitOrGroup: UnitOrGroup
    children: React.JSX.Element
  }) {
    const unitId = unitOrGroup.unitId
    const { user } = useContext(UserContext)
    const pinLoggedEmployeeId = user
      .map((u) =>
        u && u.pinLoginActive ? u.employeeId ?? undefined : undefined
      )
      .getOrElse(undefined)

    const { data: groupAccounts = [] } = useQuery(
      queryOrDefault(
        messagingAccountsQuery,
        []
      )(
        unitId && pinLoggedEmployeeId
          ? { unitId, employeeId: pinLoggedEmployeeId }
          : undefined
      )
    )

    const selectedAccount: AuthorizedMessageAccount | undefined = useMemo(
      () =>
        (unitOrGroup.type === 'unit'
          ? undefined
          : groupAccounts.find(
              ({ daycareGroup }) => daycareGroup?.id === unitOrGroup.id
            )) ?? groupAccounts[0],
      [groupAccounts, unitOrGroup]
    )

    const [replyContents, setReplyContents] = useState<Record<UUID, string>>({})

    const getReplyContent = useCallback(
      (threadId: UUID) => replyContents[threadId] ?? '',
      [replyContents]
    )
    const setReplyContent = useCallback((threadId: UUID, content: string) => {
      setReplyContents((state) => ({ ...state, [threadId]: content }))
    }, [])

    const value = useMemo(
      () => ({
        selectedAccount,
        groupAccounts,
        getReplyContent,
        setReplyContent
      }),
      [groupAccounts, selectedAccount, getReplyContent, setReplyContent]
    )

    return (
      <MessageContext.Provider value={value}>
        {children}
      </MessageContext.Provider>
    )
  }
)
