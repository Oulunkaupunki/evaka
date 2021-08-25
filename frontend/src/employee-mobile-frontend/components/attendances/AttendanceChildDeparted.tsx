// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later
import React, { useContext } from 'react'
import { useHistory } from 'react-router-dom'

import {
  AttendanceChild,
  getDaycareAttendances,
  returnToPresent
} from '../../api/attendances'
import { AttendanceUIContext } from '../../state/attendance-ui'
import { useTranslation } from '../../state/i18n'
import { InlineWideAsyncButton } from './components'

interface Props {
  child: AttendanceChild
  unitId: string
}

export default React.memo(function AttendanceChildDeparted({
  child,
  unitId
}: Props) {
  const history = useHistory()
  const { i18n } = useTranslation()

  const { setAttendanceResponse } = useContext(AttendanceUIContext)

  function returnToPresentCall() {
    return returnToPresent(unitId, child.id)
  }

  return (
    <InlineWideAsyncButton
      text={i18n.attendances.actions.returnToPresent}
      onClick={() => returnToPresentCall()}
      onSuccess={async () => {
        await getDaycareAttendances(unitId).then(setAttendanceResponse)
        history.goBack()
      }}
      data-qa="return-to-present-btn"
    />
  )
})
