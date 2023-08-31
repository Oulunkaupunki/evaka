import React from 'react'

import DateRange from 'lib-common/date-range'
import LocalDate from 'lib-common/local-date'
import Checkbox from 'lib-components/atoms/form/Checkbox'
import { AlertBox } from 'lib-components/molecules/MessageBoxes'

export const isChangeRetroactive = (
  newRange: DateRange | null,
  prevRange: DateRange | null,
  contentChanged: boolean
): boolean => {
  if (!newRange) {
    // form is not yet valid anyway
    return false
  }
  const processedEnd = LocalDate.todayInHelsinkiTz().withDate(1).subDays(1)

  const newRangeAffectsHistory = newRange.start.isEqualOrBefore(processedEnd)
  if (prevRange === null) {
    // creating new, not editing
    return newRangeAffectsHistory
  }

  const prevRangeAffectsHistory = prevRange.start.isEqualOrBefore(processedEnd)
  const eitherRangeAffectHistory =
    newRangeAffectsHistory || prevRangeAffectsHistory

  if (contentChanged && eitherRangeAffectHistory) {
    return true
  }

  if (!newRange.start.isEqual(prevRange.start) && eitherRangeAffectHistory) {
    return true
  }

  if (newRange.end === null) {
    if (prevRange.end === null) {
      // neither is finite
      return newRange.start !== prevRange.start && eitherRangeAffectHistory
    } else {
      // end date has now been removed
      return prevRange.end.isEqualOrBefore(processedEnd)
    }
  } else {
    if (prevRange.end === null) {
      // end date has now been set
      return newRange.end.isEqualOrBefore(processedEnd)
    } else {
      // both are finite
      if (newRange.start !== prevRange.start) {
        return eitherRangeAffectHistory
      } else if (newRange.end !== prevRange.end) {
        return (
          newRange.end.isEqualOrBefore(processedEnd) ||
          prevRange.end.isEqualOrBefore(processedEnd)
        )
      } else {
        return false
      }
    }
  }
}

const RetroactiveConfirmation = React.memo(function RetroactiveConfirmation({
  confirmed,
  setConfirmed
}: {
  confirmed: boolean
  setConfirmed: (confirmed: boolean) => void
}) {
  return (
    <AlertBox
      noMargin
      wide
      title="Olet tekemässä muutosta, joka voi aiheuttaa takautuvasti muutoksia asiakasmaksuihin."
      message={
        <Checkbox
          label="Ymmärrän, olen asiasta yhteydessä laskutustiimiin.*"
          checked={confirmed}
          onChange={setConfirmed}
          data-qa="confirm-retroactive"
        />
      }
    />
  )
})

export default RetroactiveConfirmation
