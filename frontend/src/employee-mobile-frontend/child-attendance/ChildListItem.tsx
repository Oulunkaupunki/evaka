// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import {
  AttendanceStatus,
  Child
} from 'lib-common/generated/api-types/attendance'
import { useQuery } from 'lib-common/query'
import { UUID } from 'lib-common/types'
import useNonNullableParams from 'lib-common/useNonNullableParams'
import RoundIcon from 'lib-components/atoms/RoundIcon'
import { FixedSpaceRow } from 'lib-components/layout/flex-helpers'
import { Bold, InformationText } from 'lib-components/typography'
import { defaultMargins } from 'lib-components/white-space'
import colors, { attendanceColors } from 'lib-customizations/common'
import { farStickyNote, farUser, farUsers } from 'lib-icons'

import { groupNotesQuery } from '../child-notes/queries'
import { getTodaysServiceTimes } from '../common/dailyServiceTimes'
import { Translations, useTranslation } from '../common/i18n'
import { UnitContext } from '../common/unit'

import { ListItem } from './ChildList'
import { Reservations } from './Reservations'

const ChildBox = styled.div`
  align-items: center;
  display: flex;
  padding: ${defaultMargins.xs} ${defaultMargins.s};
  border-radius: 2px;
  background-color: ${colors.grayscale.g0};
`

const AttendanceLinkBox = styled(Link)`
  display: flex;
  align-items: center;
  width: 100%;
`

const imageHeight = '56px'

const ChildBoxInfo = styled.div`
  margin-left: 24px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  min-height: ${imageHeight};
`

export const IconBox = styled.div<{ type: AttendanceStatus }>`
  background-color: ${(props) => attendanceColors[props.type]};
  border-radius: 50%;
  box-shadow: 0 0 0 2px ${(props) => attendanceColors[props.type]};
  border: 2px solid ${colors.grayscale.g0};
`

const DetailsRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  color: ${colors.grayscale.g70};
  font-size: 0.875em;
  width: 100%;
`

const RoundImage = styled.img`
  border-radius: 9000px;
  width: ${imageHeight};
  height: ${imageHeight};
  display: block;
`

const FixedSpaceRowWithLeftMargin = styled(FixedSpaceRow)`
  margin-left: ${defaultMargins.m};
`

const NameRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`

const GroupName = styled(InformationText)`
  white-space: nowrap;
  text-align: right;
`

interface ChildListItemProps {
  child: ListItem
  onClick?: () => void
  type?: AttendanceStatus
  childAttendanceUrl: string
}

export default React.memo(function ChildListItem({
  child,
  onClick,
  type,
  childAttendanceUrl
}: ChildListItemProps) {
  const { i18n } = useTranslation()
  const { unitInfoResponse } = useContext(UnitContext)

  const { unitId, groupId } = useNonNullableParams<{
    unitId: UUID
    groupId: UUID | 'all'
  }>()

  const { data: groupNotes } = useQuery(groupNotesQuery(child.groupId ?? ''), {
    enabled: child.groupId != null
  })
  const groupName = unitInfoResponse
    .map(
      ({ groups }) =>
        groups.find((elem) => elem.id === child.groupId)?.name.toUpperCase() ??
        ''
    )
    .getOrElse('')

  const infoText: React.ReactNode = !type
    ? groupName
    : childReservationInfo(i18n, child)

  const maybeGroupName = type && groupId === 'all' ? groupName : undefined

  return (
    <ChildBox data-qa={`child-${child.id}`}>
      <AttendanceLinkBox to={childAttendanceUrl}>
        <IconBox type={child.status}>
          {child.imageUrl ? (
            <RoundImage src={child.imageUrl} />
          ) : (
            <RoundIcon
              content={farUser}
              color={type ? attendanceColors[type] : colors.main.m1}
              size="XL"
            />
          )}
        </IconBox>
        <ChildBoxInfo onClick={onClick}>
          <NameRow>
            <Bold data-qa="child-name">
              {child.firstName} {child.lastName}
            </Bold>
            <GroupName data-qa={`child-group-name-${child.id}`}>
              {maybeGroupName}
            </GroupName>
          </NameRow>
          <DetailsRow>
            <div>
              {infoText}
              {child.backup && (
                <RoundIcon content="V" size="m" color={colors.main.m1} />
              )}
            </div>
            <FixedSpaceRowWithLeftMargin>
              {child.dailyNote && (
                <Link
                  to={`/units/${unitId}/groups/${
                    child.groupId ?? 'all'
                  }/child-attendance/${child.id}/note`}
                  data-qa="link-child-daycare-daily-note"
                >
                  <RoundIcon
                    content={farStickyNote}
                    color={colors.accents.a9pink}
                    size="m"
                  />
                </Link>
              )}
              {child.groupId && groupNotes && groupNotes.length > 0 ? (
                <Link
                  to={`/units/${unitId}/groups/${child.groupId}/child-attendance/${child.id}/note`}
                  data-qa="link-child-daycare-daily-note"
                >
                  <RoundIcon
                    content={farUsers}
                    color={colors.main.m4}
                    size="m"
                  />
                </Link>
              ) : null}
            </FixedSpaceRowWithLeftMargin>
          </DetailsRow>
        </ChildBoxInfo>
      </AttendanceLinkBox>
    </ChildBox>
  )
})

const childReservationInfo = (
  i18n: Translations,
  { reservations, dailyServiceTimes }: Child
): React.ReactNode => {
  if (reservations.length > 0) {
    return <Reservations i18n={i18n} reservations={reservations} />
  }

  const todaysServiceTime = getTodaysServiceTimes(dailyServiceTimes)

  return (
    <em>
      {todaysServiceTime === 'not_set'
        ? i18n.attendances.serviceTime.notSetShort
        : todaysServiceTime === 'not_today'
        ? i18n.attendances.serviceTime.noServiceTodayShort
        : todaysServiceTime === 'variable_times'
        ? i18n.attendances.serviceTime.variableTimesShort
        : i18n.attendances.serviceTime.serviceTodayShort(
            todaysServiceTime.start,
            todaysServiceTime.end
          )}
    </em>
  )
}