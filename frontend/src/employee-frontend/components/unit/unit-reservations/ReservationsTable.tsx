// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import classNames from 'classnames'
import { sortBy } from 'lodash'
import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'
import {
  Child,
  ChildDailyRecords,
  OperationalDay
} from 'lib-common/api-types/reservations'
import LocalDate from 'lib-common/local-date'
import IconButton from 'lib-components/atoms/buttons/IconButton'
import { Table, Tbody, Td, Th, Thead, Tr } from 'lib-components/layout/Table'
import { fontWeights, H4 } from 'lib-components/typography'
import { defaultMargins } from 'lib-components/white-space'
import colors from 'lib-customizations/common'
import { faCalendarPlus } from 'lib-icons'
import { useTranslation } from '../../../state/i18n'
import { formatName } from '../../../utils'
import AgeIndicatorIcon from '../../common/AgeIndicatorIcon'
import ChildDay from './ChildDay'

interface Props {
  operationalDays: OperationalDay[]
  allDayRows: ChildDailyRecords[]
  onMakeReservationForChild: (child: Child) => void
  selectedDate: LocalDate
}

export default React.memo(function ReservationsTable(props: Props) {
  const { operationalDays, onMakeReservationForChild, selectedDate } = props
  const { i18n, lang } = useTranslation()

  const allDayRows = useMemo(
    () =>
      sortBy(
        props.allDayRows,
        ({ child }) => child.lastName,
        ({ child }) => child.firstName
      ),
    [props.allDayRows]
  )

  return (
    <Table>
      <Thead>
        <Tr>
          <CustomTh>{i18n.unit.attendanceReservations.childName}</CustomTh>
          {operationalDays.map(({ date, isHoliday }) => (
            <DateTh shrink key={date.formatIso()} faded={isHoliday}>
              <Date centered highlight={date.isToday()}>
                {date.format('EEEEEE dd.MM.', lang)}
              </Date>
              <DayHeader>
                <span>{i18n.unit.attendanceReservations.startTime}</span>
                <span>{i18n.unit.attendanceReservations.endTime}</span>
              </DayHeader>
            </DateTh>
          ))}
          <CustomTh shrink />
        </Tr>
      </Thead>
      <Tbody>
        {allDayRows.flatMap(({ child, dailyData }) => {
          const multipleRows = dailyData.length > 1
          return dailyData.map((childDailyRecordRow, index) => (
            <DayTr
              key={`${child.id}-${index}`}
              data-qa={`reservation-row-child-${child.id}`}
            >
              <NameTd partialRow={multipleRows} rowIndex={index}>
                {index == 0 && (
                  <ChildName>
                    <AgeIndicatorIcon
                      isUnder3={
                        selectedDate.differenceInYears(child.dateOfBirth) < 3
                      }
                    />
                    <Link to={`/child-information/${child.id}`}>
                      {formatName(
                        child.firstName.split(/\s/)[0],
                        child.lastName,
                        i18n,
                        true
                      )}
                    </Link>
                  </ChildName>
                )}
              </NameTd>
              {operationalDays.map((day) => (
                <DayTd
                  key={day.date.formatIso()}
                  className={classNames({ 'is-today': day.date.isToday() })}
                  partialRow={multipleRows}
                  rowIndex={index}
                >
                  <ChildDay
                    day={day}
                    dailyServiceTimes={child.dailyServiceTimes}
                    dataForAllDays={childDailyRecordRow}
                    rowIndex={index}
                  />
                </DayTd>
              ))}
              {index == 0 && (
                <StyledTd
                  partialRow={multipleRows}
                  rowIndex={index}
                  rowSpan={multipleRows ? 2 : 1}
                >
                  <IconButton
                    data-qa={`add-reservation-for-${child.id}`}
                    icon={faCalendarPlus}
                    onClick={() => onMakeReservationForChild(child)}
                  />
                </StyledTd>
              )}
            </DayTr>
          ))
        })}
      </Tbody>
    </Table>
  )
})

const CustomTh = styled(Th)<{ shrink?: boolean }>`
  vertical-align: bottom;
  ${(p) =>
    p.shrink &&
    css`
      width: 0; // causes the column to take as little space as possible
    `}
`

const DateTh = styled(CustomTh)<{ faded: boolean }>`
  ${(p) => p.faded && `color: ${colors.grayscale.g35};`}
`

const DayHeader = styled.div`
  display: flex;
  justify-content: space-evenly;
  gap: ${defaultMargins.xs};
`

const StyledTd = styled(Td)<{ partialRow: boolean; rowIndex: number }>`
  border-right: 1px solid ${colors.grayscale.g15};
  vertical-align: middle;
  ${(p) => p.partialRow && p.rowIndex === 0 && `border-bottom-style: dashed;`}
  ${(p) => p.partialRow && p.rowIndex > 0 && `border-top-style: dashed;`}
`

const DayTd = styled(StyledTd)`
  padding: 0;
`

const DayTr = styled(Tr)`
  > ${DayTd}.is-today {
    border-left: 2px solid ${colors.status.success};
    border-right: 2px solid ${colors.status.success};
  }

  &:first-child {
    > ${DayTd}.is-today {
      border-top: 2px solid ${colors.status.success};
    }
  }
  &:last-child {
    > ${DayTd}.is-today {
      border-bottom: 2px solid ${colors.status.success};
    }
  }
`

const NameTd = styled(StyledTd)`
  width: 350px;
  ${(p) => p.partialRow && p.rowIndex === 0 && `border-bottom-style: none;`}
  ${(p) => p.partialRow && p.rowIndex > 0 && `border-top-style: none;`}
`

const ChildName = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: center;

  a {
    margin-left: ${defaultMargins.xs};
  }
`

const Date = styled(H4)<{ highlight: boolean }>`
  margin: 0 0 ${defaultMargins.s};
  ${(p) =>
    p.highlight &&
    css`
      color: ${colors.main.m2};
      font-weight: ${fontWeights.semibold};
    `}
`
