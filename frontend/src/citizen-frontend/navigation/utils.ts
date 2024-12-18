// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import sum from 'lodash/sum'
import sumBy from 'lodash/sumBy'
import { useMemo } from 'react'

import { useQuery } from 'lib-common/query'
import { UUID } from 'lib-common/types'

import { User, useUser } from '../auth/state'
import { unreadChildDocumentsCountQuery } from '../child-documents/queries'
import { childrenQuery } from '../children/queries'
import { unreadPedagogicalDocumentsCountQuery } from '../children/sections/pedagogical-documents/queries'
import { assistanceDecisionUnreadCountsQuery } from '../decisions/assistance-decision-page/queries'
import { assistanceNeedPreschoolDecisionUnreadCountsQuery } from '../decisions/assistance-decision-page/queries-preschool'
import { applicationNotificationsQuery } from '../decisions/queries'

const empty = {}

export function useUnreadChildNotifications() {
  const loggedIn = useUser() !== undefined
  const { data: unreadPedagogicalDocumentsCount = empty } = useQuery(
    unreadPedagogicalDocumentsCountQuery(),
    { enabled: loggedIn }
  )
  const { data: unreadChildDocumentsCount = empty } = useQuery(
    unreadChildDocumentsCountQuery(),
    { enabled: loggedIn }
  )

  const unreadChildNotifications = useMemo(() => {
    const counts: Record<UUID, number> = {}
    const addCounts = (countRecord: Record<UUID, number>) =>
      Object.entries(countRecord).forEach(([id, count]) => {
        counts[id] = (counts[id] ?? 0) + count
      })

    addCounts(unreadPedagogicalDocumentsCount)
    addCounts(unreadChildDocumentsCount)

    return counts
  }, [unreadPedagogicalDocumentsCount, unreadChildDocumentsCount])

  const totalUnreadChildNotifications = useMemo(
    () => sum(Object.values(unreadChildNotifications)),
    [unreadChildNotifications]
  )

  return { unreadChildNotifications, totalUnreadChildNotifications }
}

export function useChildrenWithOwnPage() {
  const { data } = useQuery(childrenQuery())
  return useMemo(() => {
    if (!data) return []
    return data.filter(
      (child) =>
        child.upcomingPlacementType !== null || child.hasPedagogicalDocuments
    )
  }, [data])
}

export function useUnreadDecisions() {
  const loggedIn = useUser() !== undefined
  const { data: unreadDaycareAssistanceDecisionCounts = [] } = useQuery(
    assistanceDecisionUnreadCountsQuery(),
    { enabled: loggedIn }
  )
  const { data: unreadPreschoolAssistanceDecisionCounts = [] } = useQuery(
    assistanceNeedPreschoolDecisionUnreadCountsQuery(),
    { enabled: loggedIn }
  )
  const { data: decisionWaitingConfirmationCount = 0 } = useQuery(
    applicationNotificationsQuery(),
    { enabled: loggedIn }
  )

  return (
    decisionWaitingConfirmationCount +
    sumBy(unreadDaycareAssistanceDecisionCounts, ({ count }) => count) +
    sumBy(unreadPreschoolAssistanceDecisionCounts, ({ count }) => count)
  )
}

export const isPersonalDetailsIncomplete = (user: User) => !user.email
