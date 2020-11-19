// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { Fragment, useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'

import {
  AttendanceChild,
  childArrivesPOST,
  getDaycareAttendances,
  Group,
  postFullDayAbsence
} from '~api/attendances'
import InputField from '~components/shared/atoms/form/InputField'
import Loader from '~components/shared/atoms/Loader'
import {
  absenceBackgroundColours,
  absenceBorderColours,
  absenceColours
} from '~components/shared/Colors'
import { FixedSpaceColumn } from '~components/shared/layout/flex-helpers'
import { Gap } from '~components/shared/layout/white-space'
import { AttendanceUIContext } from '~state/attendance-ui'
import { useTranslation } from '~state/i18n'
import { UUID } from '~types'
import { AbsenceType, AbsenceTypes } from '~types/absence'
import { getCurrentTime } from './AttendanceChildPage'
import {
  CustomAsyncButton,
  BigWideButton,
  BigWideInlineButton,
  WideAsyncButton,
  Flex,
  FlexLabel
} from './components'

interface Props {
  unitId: UUID
  child: AttendanceChild
  group: Group
  groupId: UUID | 'all'
}

export default React.memo(function AttendanceChildComing({
  unitId,
  child,
  group,
  groupId: groupIdOrAll
}: Props) {
  const history = useHistory()
  const { i18n } = useTranslation()

  const [time, setTime] = useState<string>(getCurrentTime())
  const [markAbsence, setMarkAbsence] = useState<boolean>(false)
  const [markPresent, setMarkPresent] = useState<boolean>(false)

  const { filterAndSetAttendanceResponse } = useContext(AttendanceUIContext)

  useEffect(() => {
    void getDaycareAttendances(unitId).then((res) =>
      filterAndSetAttendanceResponse(res, groupIdOrAll)
    )
    return history.listen((location) => {
      if (location.pathname.includes('/present')) {
        setTime(getCurrentTime())
        setMarkPresent(true)
      } else if (location.pathname.includes('/absent')) {
        setMarkAbsence(true)
      } else {
        setMarkPresent(false)
        setMarkAbsence(false)
        void getDaycareAttendances(unitId).then((res) =>
          filterAndSetAttendanceResponse(res, groupIdOrAll)
        )
      }
    })
  }, [])

  function selectAbsenceType(absenceType: AbsenceType) {
    return postFullDayAbsence(unitId, child.id, absenceType)
  }

  function childArrives() {
    return childArrivesPOST(unitId, child.id, time)
  }

  return (
    <Fragment>
      {markAbsence &&
        (child && group ? (
          <Fragment>
            <Gap size={'s'} />
            <Flex>
              {AbsenceTypes.filter(
                (absenceType) =>
                  absenceType !== 'PRESENCE' &&
                  absenceType !== 'PARENTLEAVE' &&
                  absenceType !== 'FORCE_MAJEURE'
              ).map((absenceType) => (
                <CustomAsyncButton
                  backgroundColor={absenceBackgroundColours[absenceType]}
                  borderColor={absenceBorderColours[absenceType]}
                  color={absenceColours[absenceType]}
                  key={absenceType}
                  text={i18n.absences.absenceTypes[absenceType]}
                  onClick={() => selectAbsenceType(absenceType)}
                  onSuccess={async () => {
                    await getDaycareAttendances(unitId).then((res) =>
                      filterAndSetAttendanceResponse(res, groupIdOrAll)
                    )
                    history.goBack()
                  }}
                  data-qa={`mark-absent-${absenceType}`}
                />
              ))}
            </Flex>
          </Fragment>
        ) : (
          <Loader />
        ))}

      {!markAbsence && !markPresent && (
        <Fragment>
          <FixedSpaceColumn>
            <BigWideButton
              primary
              text={i18n.attendances.actions.markPresent}
              onClick={() =>
                history.push(
                  `/units/${unitId}/groups/${groupIdOrAll}/childattendance/${child.id}/present`
                )
              }
              data-qa="mark-present"
            />

            <BigWideInlineButton
              text={i18n.attendances.actions.markAbsent}
              onClick={() =>
                history.push(
                  `/units/${unitId}/groups/${groupIdOrAll}/childattendance/${child.id}/absent`
                )
              }
            />
          </FixedSpaceColumn>
        </Fragment>
      )}

      {markPresent && (
        <Fragment>
          <FixedSpaceColumn>
            <FlexLabel>
              <span>{i18n.attendances.arrivalTime}</span>
              <InputField
                onChange={setTime}
                value={time}
                width="s"
                type="time"
                data-qa="set-time"
              />
            </FlexLabel>

            <WideAsyncButton
              primary
              text={i18n.common.confirm}
              onClick={() => childArrives()}
              onSuccess={async () => {
                await getDaycareAttendances(unitId).then((res) =>
                  filterAndSetAttendanceResponse(res, groupIdOrAll)
                )
                history.goBack()
              }}
              data-qa="mark-present"
            />
          </FixedSpaceColumn>
        </Fragment>
      )}
    </Fragment>
  )
})
