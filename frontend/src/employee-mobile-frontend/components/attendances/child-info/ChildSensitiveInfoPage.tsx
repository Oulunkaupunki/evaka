// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import useNonNullableParams from 'lib-common/useNonNullableParams'
import { useApiState } from 'lib-common/utils/useRestApi'

import { getChildSensitiveInformation } from '../../../api/sensitive'
import { ChildAttendanceContext } from '../../../state/child-attendance'
import { useTranslation } from '../../../state/i18n'
import { renderPinRequiringResult } from '../../auth/renderPinRequiringResult'
import TopBar from '../../common/TopBar'
import { TallContentArea } from '../../mobile/components'

import ChildSensitiveInfo from './ChildSensitiveInfo'

export default React.memo(function ChildSensitiveInfoPage() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()

  const { attendanceResponse } = useContext(ChildAttendanceContext)

  const { childId } = useNonNullableParams<{ childId: string }>()

  const childName = useMemo(
    () =>
      attendanceResponse
        .map(({ children }) => children.find((ac) => ac.id === childId))
        .map((c) => (c ? `${c.firstName} ${c.lastName}` : null))
        .getOrElse(null),
    [attendanceResponse, childId]
  )

  const [childSensitiveResult] = useApiState(
    () => getChildSensitiveInformation(childId),
    [childId]
  )

  return (
    <TallContentAreaNoOverflow
      opaque={false}
      paddingHorizontal="zero"
      paddingVertical="zero"
    >
      <TopBar
        title={childName ?? i18n.common.back}
        onBack={() => navigate(-1)}
        invertedColors
      />
      {renderPinRequiringResult(childSensitiveResult, (child) => (
        <ChildSensitiveInfo child={child} />
      ))}
    </TallContentAreaNoOverflow>
  )
})

const TallContentAreaNoOverflow = styled(TallContentArea)`
  overflow-x: hidden;
`