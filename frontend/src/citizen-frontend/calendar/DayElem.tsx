import React from 'react'
import styled from 'styled-components'
import colors from 'lib-customizations/common'
import { formatDate } from 'lib-common/date'
import LocalDate from 'lib-common/local-date'
import {
  FixedSpaceColumn,
  FixedSpaceRow
} from 'lib-components/layout/flex-helpers'
import { useTranslation } from '../localization'
import { DailyReservationData, Reservation } from './api'
import { defaultMargins } from 'lib-components/white-space'

export interface DayProps {
  dailyReservations: DailyReservationData
  selectDate: (date: LocalDate) => void
}

export default React.memo(function DayElem({
  dailyReservations: { date, isHoliday, reservations },
  selectDate
}: DayProps) {
  const i18n = useTranslation()

  return (
    <DayDiv
      alignItems="center"
      today={date.isToday()}
      onClick={() => selectDate(date)}
    >
      <DayColumn spacing="xxs" holiday={isHoliday}>
        <div>
          {i18n.common.datetime.weekdaysShort[date.getIsoDayOfWeek() - 1]}
        </div>
        <div>{date.format('dd.MM.')}</div>
      </DayColumn>
      <div>
        {reservations.length === 0 && isHoliday && (
          <HolidayNote>{i18n.calendar.holiday}</HolidayNote>
        )}
        {uniqueReservations(reservations)
          .map(
            (reservation) =>
              `${formatDate(reservation.startTime, 'HH:mm')} - ${formatDate(
                reservation.endTime,
                'HH:mm'
              )}`
          )
          .join(', ')}
      </div>
      {date.isBefore(LocalDate.today()) && <HistoryOverlay />}
    </DayDiv>
  )
})

const uniqueReservations = (reservations: Reservation[]) =>
  reservations.reduce<Reservation[]>(
    (uniq, reservation) =>
      uniq.some(
        ({ startTime, endTime }) =>
          formatDate(startTime, 'HH:mm') ===
            formatDate(reservation.startTime, 'HH:mm') &&
          formatDate(endTime, 'HH:mm') ===
            formatDate(reservation.endTime, 'HH:mm')
      )
        ? uniq
        : [...uniq, reservation],
    []
  )

const DayDiv = styled(FixedSpaceRow)<{ today: boolean }>`
  position: relative;
  padding: ${defaultMargins.s} ${defaultMargins.s};
  border-bottom: 1px solid ${colors.greyscale.lighter};
  border-left: 6px solid
    ${(p) => (p.today ? colors.brandEspoo.espooTurquoise : 'transparent')};
  cursor: pointer;
`

const DayColumn = styled(FixedSpaceColumn)<{ holiday: boolean }>`
  width: 3rem;
  color: ${(p) => (p.holiday ? colors.greyscale.dark : colors.blues.dark)};
  font-weight: 600;
`

const HolidayNote = styled.div`
  font-style: italic;
  color: ${colors.greyscale.dark};
`

const HistoryOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  opacity: 0.3;
  background-color: ${colors.blues.lighter};
`
