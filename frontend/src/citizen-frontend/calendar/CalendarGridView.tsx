// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import sum from 'lodash/sum'
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from 'react'
import styled, { css, useTheme } from 'styled-components'

import FiniteDateRange from 'lib-common/finite-date-range'
import { CitizenCalendarEvent } from 'lib-common/generated/api-types/calendarevent'
import {
  DailyReservationData,
  ReservationChild
} from 'lib-common/generated/api-types/reservations'
import LocalDate from 'lib-common/local-date'
import { scrollToPos } from 'lib-common/utils/scrolling'
import InlineButton from 'lib-components/atoms/buttons/InlineButton'
import Container, { ContentArea } from 'lib-components/layout/Container'
import { fontWeights, H2 } from 'lib-components/typography'
import { defaultMargins } from 'lib-components/white-space'
import colors from 'lib-customizations/common'
import { faCalendar, faCalendarPlus, faTreePalm, faUserMinus } from 'lib-icons'

import { useHolidayPeriods } from '../holiday-periods/state'
import { useLang, useTranslation } from '../localization'
import { headerHeightDesktop } from '../navigation/const'

import { asWeeklyData, WeeklyData } from './CalendarListView'
import { CalendarNotificationsSlot } from './CalendarNotifications'
import { HistoryOverlay } from './HistoryOverlay'
import ReportHolidayLabel from './ReportHolidayLabel'
import { ChildImageData, getChildImages } from './RoundChildImages'
import { Reservations } from './calendar-elements'

export interface Props {
  childData: ReservationChild[]
  dailyData: DailyReservationData[]
  onCreateReservationClicked: () => void
  onCreateAbsencesClicked: (initialDate: LocalDate | undefined) => void
  onReportHolidaysClicked: () => void
  selectedDate: LocalDate | undefined
  selectDate: (date: LocalDate) => void
  includeWeekends: boolean
  dayIsReservable: (dailyData: DailyReservationData) => boolean
  events: CitizenCalendarEvent[]
}

export default React.memo(function CalendarGridView({
  childData,
  dailyData,
  onCreateReservationClicked,
  onCreateAbsencesClicked,
  onReportHolidaysClicked,
  selectedDate,
  selectDate,
  includeWeekends,
  dayIsReservable,
  events
}: Props) {
  const i18n = useTranslation()
  const monthlyData = useMemo(() => asMonthlyData(dailyData), [dailyData])
  const headerRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const top = todayRef.current?.getBoundingClientRect().top

    if (top) {
      scrollToPos({
        top: top - headerHeightDesktop * 2 - 32
      })
    }
  }, [])

  const onCreateAbsences = useCallback(
    () => onCreateAbsencesClicked(undefined),
    [onCreateAbsencesClicked]
  )

  const { holidayPeriods: holidayPeriodResult, questionnaireAvailable } =
    useHolidayPeriods()
  const holidayPeriods = useMemo<FiniteDateRange[]>(
    () => holidayPeriodResult.map((p) => p.map((i) => i.period)).getOrElse([]),
    [holidayPeriodResult]
  )

  const childImages = useMemo(() => getChildImages(childData), [childData])

  return (
    <>
      <StickyHeader ref={headerRef}>
        <NotificationSlotContainer>
          <CalendarNotificationsSlot />
        </NotificationSlotContainer>
      </StickyHeader>
      <StickyBottomBar>
        <ButtonContainer>
          {questionnaireAvailable && (
            <InlineButton
              onClick={onReportHolidaysClicked}
              text={<ReportHolidayLabel iconRight />}
              icon={faTreePalm}
              data-qa="open-holiday-modal"
            />
          )}
          <InlineButton
            onClick={onCreateAbsences}
            text={i18n.calendar.newAbsence}
            icon={faUserMinus}
            data-qa="open-absences-modal"
          />
          <InlineButton
            onClick={onCreateReservationClicked}
            text={i18n.calendar.newReservationBtn}
            icon={faCalendarPlus}
            data-qa="open-reservations-modal"
          />
        </ButtonContainer>
      </StickyBottomBar>
      <Container>
        {monthlyData.map(({ month, year, weeks }) => (
          <Month
            key={`${month}${year}`}
            year={year}
            month={month}
            childData={childData}
            weeks={weeks}
            holidayPeriods={holidayPeriods}
            todayRef={todayRef}
            selectedDate={selectedDate}
            selectDate={selectDate}
            includeWeekends={includeWeekends}
            dayIsReservable={dayIsReservable}
            childImages={childImages}
            events={events}
          />
        ))}
      </Container>
    </>
  )
})

const NotificationSlotContainer = styled.div`
  position: absolute;
  top: 0;
  right: ${defaultMargins.s};
  z-index: 10;
  padding-left: 16px;
`

interface MonthlyData {
  month: number
  year: number
  weeks: WeeklyData[]
}

const asMonthlyData = (dailyData: DailyReservationData[]): MonthlyData[] => {
  const getWeekMonths = (weeklyData: WeeklyData) => {
    const firstDay = weeklyData.dailyReservations[0].date
    const lastDay =
      weeklyData.dailyReservations[weeklyData.dailyReservations.length - 1].date

    return firstDay.month === lastDay.month
      ? [[firstDay.month, firstDay.year]]
      : [
          [firstDay.month, firstDay.year],
          [lastDay.month, lastDay.year]
        ]
  }

  return asWeeklyData(dailyData).reduce<MonthlyData[]>(
    (monthlyData, weeklyData) => {
      const weekMonths = getWeekMonths(weeklyData).map(([month, year]) => ({
        month,
        year,
        weeks: [weeklyData]
      }))

      if (monthlyData.length === 0) {
        // The first week in the data can be the last and first week of a month.
        // In that case we don't want to include the incomplete month.
        const firstWeekOfTheMonth = weekMonths[weekMonths.length - 1]

        // Drop the week altogether if it does not actually include the first
        // days of the month. This can happen because the first day of the month
        // can be eg. a sunday, which might not be shown on the calendar.
        if (
          firstWeekOfTheMonth.weeks[0].dailyReservations.some(
            ({ date }) => date.date <= 3
          )
        ) {
          return [firstWeekOfTheMonth]
        }

        return []
      }

      const lastMonth = monthlyData[monthlyData.length - 1]
      const monthsBeforeLast = monthlyData.slice(0, monthlyData.length - 1)

      if (lastMonth.month === weekMonths[0].month) {
        return [
          ...monthsBeforeLast,
          {
            ...lastMonth,
            weeks: [...lastMonth.weeks, weeklyData]
          },
          ...(weekMonths[1] ? [weekMonths[1]] : [])
        ]
      }

      return [...monthsBeforeLast, lastMonth, ...weekMonths]
    },
    []
  )
}

const daysWithoutWeekends = [0, 1, 2, 3, 4]
const daysWithWeekends = [0, 1, 2, 3, 4, 5, 6]

const Month = React.memo(function Month({
  year,
  month,
  childData,
  weeks,
  holidayPeriods,
  todayRef,
  selectDate,
  selectedDate,
  includeWeekends,
  dayIsReservable,
  childImages,
  events
}: {
  year: number
  month: number
  childData: ReservationChild[]
  weeks: WeeklyData[]
  holidayPeriods: FiniteDateRange[]
  todayRef: MutableRefObject<HTMLButtonElement | null>
  selectedDate: LocalDate | undefined
  selectDate: (date: LocalDate) => void
  includeWeekends: boolean
  dayIsReservable: (dailyData: DailyReservationData) => boolean
  childImages: ChildImageData[]
  events: CitizenCalendarEvent[]
}) {
  const i18n = useTranslation()
  return (
    <ContentArea opaque={false} key={`${month}${year}`}>
      <MonthTitle>{`${
        i18n.common.datetime.months[month - 1]
      } ${year}`}</MonthTitle>
      <CalendarHeader includeWeekends={includeWeekends}>
        <HeadingCell />
        {(includeWeekends ? daysWithWeekends : daysWithoutWeekends).map((d) => (
          <HeadingCell key={d}>
            {i18n.common.datetime.weekdaysShort[d]}
          </HeadingCell>
        ))}
      </CalendarHeader>
      <Grid includeWeekends={includeWeekends}>
        {weeks.map((w) => (
          <Week
            key={`${w.weekNumber}${month}${year}`}
            year={year}
            month={month}
            childData={childData}
            week={w}
            holidayPeriods={holidayPeriods}
            todayRef={todayRef}
            selectedDate={selectedDate}
            selectDate={selectDate}
            dayIsReservable={dayIsReservable}
            childImages={childImages}
            events={events}
          />
        ))}
      </Grid>
    </ContentArea>
  )
})

const Week = React.memo(function Week({
  year,
  month,
  childData,
  week,
  holidayPeriods,
  todayRef,
  selectedDate,
  selectDate,
  dayIsReservable,
  childImages,
  events
}: {
  year: number
  month: number
  childData: ReservationChild[]
  week: WeeklyData
  holidayPeriods: FiniteDateRange[]
  todayRef: MutableRefObject<HTMLButtonElement | null>
  selectedDate: LocalDate | undefined
  selectDate: (date: LocalDate) => void
  dayIsReservable: (dailyData: DailyReservationData) => boolean
  childImages: ChildImageData[]
  events: CitizenCalendarEvent[]
}) {
  return (
    <>
      <WeekNumber>{week.weekNumber}</WeekNumber>
      {week.dailyReservations.map((d) => (
        <Day
          key={`${d.date.formatIso()}${month}${year}`}
          day={d}
          childData={childData}
          holidayPeriods={holidayPeriods}
          todayRef={todayRef}
          dateType={dateType(year, month, d.date)}
          selected={selectedDate !== undefined && d.date.isEqual(selectedDate)}
          selectDate={selectDate}
          dayIsReservable={dayIsReservable}
          childImages={childImages}
          events={events}
        />
      ))}
    </>
  )
})

type DateType = 'past' | 'today' | 'future' | 'otherMonth'

function dateType(year: number, month: number, date: LocalDate): DateType {
  if (date.year !== year || date.month !== month) return 'otherMonth'
  const today = LocalDate.todayInSystemTz()
  return date.isBefore(today) ? 'past' : date.isToday() ? 'today' : 'future'
}

export const CalendarEventCountContainer = styled.div`
  position: relative;
  font-size: 20px;
  height: fit-content;
`

export const CalendarEventCount = styled.div`
  padding: 2px;
  height: 20px;
  min-width: 20px;
  background-color: ${(p) => p.theme.colors.status.warning};
  color: ${(p) => p.theme.colors.grayscale.g0};
  font-weight: ${fontWeights.bold};
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 100%;
  left: 100%;
  transform: translate(-60%, -60%);
  font-size: 14px;
  border-radius: 9999px;
`

const Day = React.memo(function Day({
  day,
  childData,
  holidayPeriods,
  todayRef,
  dateType,
  selected,
  selectDate,
  dayIsReservable,
  childImages,
  events
}: {
  day: DailyReservationData
  childData: ReservationChild[]
  holidayPeriods: FiniteDateRange[]
  todayRef: MutableRefObject<HTMLButtonElement | null>
  dateType: DateType
  selected: boolean
  selectDate: (date: LocalDate) => void
  dayIsReservable: (dailyData: DailyReservationData) => boolean
  childImages: ChildImageData[]
  events: CitizenCalendarEvent[]
}) {
  const [lang] = useLang()
  const ref = useCallback(
    (e: HTMLButtonElement) => {
      if (dateType === 'today') {
        todayRef.current = e ?? undefined
      }
    },
    [dateType, todayRef]
  )
  const markedByEmployee = useMemo(
    () =>
      day.children.length > 0 && day.children.every((c) => c.markedByEmployee),
    [day.children]
  )
  const holidayPeriod = useMemo(
    () => holidayPeriods.some((p) => p.includes(day.date)),
    [day.date, holidayPeriods]
  )
  const onClick = useCallback(
    () => selectDate(day.date),
    [day.date, selectDate]
  )

  const eventCount = useMemo(
    () =>
      sum(
        events.map(
          ({ attendingChildren }) =>
            Object.values(attendingChildren).filter((attending) =>
              attending.some(({ periods }) =>
                periods.some((period) => period.includes(day.date))
              )
            ).length
        )
      ),
    [day.date, events]
  )

  const theme = useTheme()

  const i18n = useTranslation()

  if (dateType === 'otherMonth') {
    return <InactiveCell />
  }

  return (
    <DayCell
      ref={ref}
      today={dateType === 'today'}
      markedByEmployee={markedByEmployee}
      holidayPeriod={holidayPeriod}
      selected={selected}
      onClick={onClick}
      data-qa={`desktop-calendar-day-${day.date.formatIso()}`}
    >
      <DayCellHeader>
        <DayCellDate
          inactive={!dayIsReservable(day)}
          aria-label={day.date.formatExotic('EEEE do MMMM', lang)}
          holiday={day.isHoliday}
        >
          {day.date.format('d.M.')}
        </DayCellDate>
        {eventCount > 0 && (
          <CalendarEventCountContainer
            aria-label={`${eventCount} ${i18n.calendar.eventsCount}`}
          >
            <FontAwesomeIcon color={theme.colors.main.m2} icon={faCalendar} />
            <CalendarEventCount data-qa="event-count">
              {eventCount}
            </CalendarEventCount>
          </CalendarEventCountContainer>
        )}
      </DayCellHeader>
      <div data-qa="reservations">
        <Reservations
          data={day}
          allChildren={childData}
          childImages={childImages}
        />
      </div>
      {dateType === 'past' && <HistoryOverlay />}
    </DayCell>
  )
})

const StickyHeader = styled.div`
  position: sticky;
  top: ${defaultMargins.s};
  z-index: 2;
  width: 100%;
`

const StickyBottomBar = styled.div`
  position: fixed;
  bottom: 0;
  z-index: 2;
  width: 100%;
  height: 80px;
  background: ${(p) => p.theme.colors.grayscale.g0};
  box-shadow: 0 -4px 8px 2px #0000000a;
`

const ButtonContainer = styled(Container)`
  height: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: ${defaultMargins.L};
`

const gridPattern = (includeWeekends: boolean) => css`
  display: grid;
  grid-template-columns: 28px repeat(${includeWeekends ? 7 : 5}, 1fr);
`

const CalendarHeader = styled.div<{ includeWeekends: boolean }>`
  ${({ includeWeekends }) => gridPattern(includeWeekends)}
`

const Grid = styled.div<{ includeWeekends: boolean }>`
  ${({ includeWeekends }) => gridPattern(includeWeekends)}
  > * {
    margin-top: 0;
    margin-left: 0;
    margin-bottom: 1px;
    margin-right: 1px;
  }
`

const HeadingCell = styled.div`
  color: ${colors.main.m1};
  font-family: 'Open Sans', sans-serif;
  font-style: normal;
  padding: ${defaultMargins.xxs} ${defaultMargins.s};
`

const WeekNumber = styled(HeadingCell)`
  padding: ${defaultMargins.s} ${defaultMargins.xs} 0 0;
  text-align: right;
`

const MonthTitle = styled(H2).attrs({ noMargin: true })`
  color: ${(p) => p.theme.colors.main.m1};
`

const DayCell = styled.button<{
  today: boolean
  markedByEmployee: boolean
  selected: boolean
  holidayPeriod: boolean
}>`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  position: relative;
  min-height: 150px;
  padding: ${defaultMargins.s};
  background-color: ${(p) =>
    p.markedByEmployee
      ? p.theme.colors.grayscale.g15
      : p.holidayPeriod
      ? p.theme.colors.accents.a10powder
      : p.theme.colors.grayscale.g0};
  border: none;
  outline: 1px solid ${colors.grayscale.g15};
  cursor: pointer;
  user-select: none;
  text-align: left;

  ${(p) =>
    p.today
      ? css`
          border-left: 4px solid ${colors.status.success};
          padding-left: calc(${defaultMargins.s} - 3px);
        `
      : ''};

  ${(p) =>
    p.selected
      ? css`
          box-shadow: 0 2px 3px 2px #00000030;
          z-index: 1;
        `
      : ''};

  :focus {
    box-shadow: 0 0 0 4px ${(p) => p.theme.colors.main.m2Focus};
    z-index: 1;
  }
`

const DayCellHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${defaultMargins.s};
  width: 100%;
`

const DayCellDate = styled.div<{ inactive: boolean; holiday: boolean }>`
  font-family: Montserrat, sans-serif;
  font-style: normal;
  color: ${(p) =>
    p.inactive
      ? colors.grayscale.g70
      : p.holiday
      ? colors.accents.a2orangeDark
      : colors.main.m1};
  font-weight: ${fontWeights.semibold};
  font-size: 1.25rem;
`

const InactiveCell = styled.div`
  background-color: transparent;
`