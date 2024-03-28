// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'

import useRouteParams from 'lib-common/useRouteParams'

import { SelectedGroupId } from '../common/selected-group'
import {
  mapChildAttendanceUIState,
  parseChildAttendanceUiState
} from '../types'

import AttendanceList from './AttendanceList'
import { useAttendanceContext } from './AttendancePageWrapper'

export default React.memo(function AttendancePageWrapper({
  selectedGroupId
}: {
  selectedGroupId: SelectedGroupId
}) {
  const { attendanceStatus } = useRouteParams(['attendanceStatus'])
  const attendanceUiState = parseChildAttendanceUiState(attendanceStatus)
  const { attendanceStatuses, unitChildren } = useAttendanceContext()

  if (!attendanceUiState) {
    throw new Error('Invalid attendance status')
  }

  return (
    <AttendanceList
      activeStatus={mapChildAttendanceUIState(attendanceUiState)}
      unitChildren={unitChildren}
      attendanceStatuses={attendanceStatuses}
      selectedGroupId={selectedGroupId}
    />
  )
})
