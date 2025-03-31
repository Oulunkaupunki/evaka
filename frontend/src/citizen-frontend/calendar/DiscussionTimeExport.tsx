// SPDX-FileCopyrightText: 2017-2025 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import ical, { ICalCalendarMethod } from 'ical-generator'
import { getZoneString } from 'icalzone'
import React, { useCallback } from 'react'

import { useTranslation } from 'citizen-frontend/localization'
import { CitizenCalendarEventTime } from 'lib-common/generated/api-types/calendarevent'
import HelsinkiDateTime from 'lib-common/helsinki-date-time'
import { Button } from 'lib-components/atoms/buttons/Button'
import { faCalendar } from 'lib-icons'

interface DiscussionTimeAttendeeInfo {
  groupName: string | null
  unitName: string | null
}

interface DiscussionTimeExportProps {
  discussionTime: CitizenCalendarEventTime
  eventTitle: string
  eventAttendeeInfo?: DiscussionTimeAttendeeInfo
}

export const DiscussionTimeExportButton = React.memo(
  function DiscussionTimeExportButton({
    discussionTime,
    eventTitle,
    eventAttendeeInfo
  }: DiscussionTimeExportProps) {
    const i18n = useTranslation()

    const downloadIcs = useCallback(() => {
      const fileName = `${i18n.calendar.discussionTimeReservation.discussionTimeFileName}_${discussionTime.date.formatIso()}.ics`
      const calendar = ical()
      calendar.method(ICalCalendarMethod.REQUEST)
      calendar.timezone({
        name: 'VTZ',
        generator: (zoneName: string) => getZoneString(zoneName) ?? null
      })
      calendar.createEvent({
        summary: eventTitle,
        location: `${eventAttendeeInfo?.unitName ?? ''} ${eventAttendeeInfo?.groupName ? `(${eventAttendeeInfo.groupName})` : ''}`,
        start: HelsinkiDateTime.fromLocal(
          discussionTime.date,
          discussionTime.startTime
        ).formatIso(),
        end: HelsinkiDateTime.fromLocal(
          discussionTime.date,
          discussionTime.endTime
        ).formatIso(),
        timezone: 'Europe/Helsinki'
      })
      const link = document.createElement('a')
      link.download = fileName
      link.href = `data:text/calendar;charset=utf-8,${calendar.toString()}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }, [i18n, eventTitle, eventAttendeeInfo, discussionTime])

    return (
      <Button
        appearance="inline"
        text={i18n.calendar.discussionTimeReservation.calendarExportButtonLabel}
        onClick={() => {
          downloadIcs()
        }}
        icon={faCalendar}
      />
    )
  }
)
