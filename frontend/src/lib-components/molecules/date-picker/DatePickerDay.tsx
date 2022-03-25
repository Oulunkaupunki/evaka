// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { fi, sv, enGB } from 'date-fns/locale'
import React from 'react'
import DayPicker, { DayModifiers } from 'react-day-picker'

import LocalDate from 'lib-common/local-date'
import { capitalizeFirstLetter } from 'lib-common/string'

import 'react-day-picker/lib/style.css'

const monthNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

const weekdayNumbers = [0, 1, 2, 3, 4, 5, 6]

interface Props {
  handleDayClick: (day: Date, modifiers?: DayModifiers) => void
  inputValue: string
  locale: 'fi' | 'sv' | 'en'
  isValidDate?: (date: LocalDate) => boolean
  initialMonth?: LocalDate
}

export default React.memo(function DatePickerDay({
  handleDayClick,
  inputValue,
  locale,
  isValidDate,
  initialMonth
}: Props) {
  const dateI18n = locale === 'sv' ? sv : locale === 'en' ? enGB : fi

  function convertToDate(date: string) {
    try {
      return LocalDate.parseFiOrThrow(date).toSystemTzDate()
    } catch (e) {
      return undefined
    }
  }

  const months = monthNumbers
    .map((m) => dateI18n.localize?.month(m) ?? '') // eslint-disable-line @typescript-eslint/no-unsafe-return
    .map(capitalizeFirstLetter)
  const weekdaysLong = weekdayNumbers
    .map((d) => dateI18n.localize?.day(d) ?? '') // eslint-disable-line @typescript-eslint/no-unsafe-return
    .map(capitalizeFirstLetter)
  const weekdaysShort = weekdayNumbers
    .map((d) => dateI18n.localize?.day(d, { width: 'short' }) ?? '') // eslint-disable-line @typescript-eslint/no-unsafe-return
    .map(capitalizeFirstLetter)

  return (
    <DayPicker
      onDayClick={handleDayClick}
      locale={locale}
      months={months}
      weekdaysLong={weekdaysLong}
      weekdaysShort={weekdaysShort}
      firstDayOfWeek={locale === 'en' ? 0 : 1}
      selectedDays={convertToDate(inputValue)}
      disabledDays={(date: Date) => {
        const localDate = LocalDate.fromSystemTzDate(date)
        return isValidDate ? !isValidDate(localDate) : false
      }}
      initialMonth={convertToDate(inputValue) ?? initialMonth?.toSystemTzDate()}
    />
  )
})
