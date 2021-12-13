// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ChildPlacement } from 'lib-common/generated/api-types/placement'
import LocalDate from 'lib-common/local-date'
import AsyncButton from 'lib-components/atoms/buttons/AsyncButton'
import Checkbox from 'lib-components/atoms/form/Checkbox'
import DatePicker from 'lib-components/molecules/date-picker/DatePicker'
import ExpandingInfo from 'lib-components/molecules/ExpandingInfo'
import { Label } from 'lib-components/typography'
import React, { useCallback, useMemo, useState } from 'react'
import { useLang, useTranslation } from '../localization'
import { terminatePlacement, TerminatePlacementParams } from './api'

interface UiState {
  placement: ChildPlacement | undefined
  terminationDate: string | undefined
}

const emptyState = (): UiState => ({
  placement: undefined,
  terminationDate: undefined
})

interface Props {
  placements: ChildPlacement[]
  onSuccess: () => void
}

type TerminationFormState =
  | { type: 'valid'; data: TerminatePlacementParams }
  | { type: 'invalid-date' }
  | { type: 'invalid-missing' }

const validateTerminationDate = (
  terminationDate: LocalDate,
  placementEndDate: LocalDate | undefined
): boolean =>
  (!placementEndDate || placementEndDate.isAfter(terminationDate)) &&
  terminationDate.isEqualOrAfter(LocalDate.today())

export default React.memo(function PlacementTerminationForm({
  placements,
  onSuccess
}: Props) {
  const t = useTranslation()
  const [lang] = useLang()

  const getPlacementLabel = (p: ChildPlacement) =>
    [
      t.placement.type[p.placementType],
      p.placementUnitName,
      t.children.placementTermination.until(p.placementEndDate.format())
    ].join(', ')

  const [state, setState] = useState<UiState>(emptyState())

  const isValidDate = useCallback(
    (date: LocalDate): boolean =>
      validateTerminationDate(date, state.placement?.placementEndDate),
    [state.placement]
  )

  const terminationState = useMemo<TerminationFormState>(() => {
    if (!(state.placement && state.terminationDate)) {
      return { type: 'invalid-missing' }
    }
    const date = LocalDate.parseFiOrNull(state.terminationDate)
    return date &&
      validateTerminationDate(date, state.placement.placementEndDate)
      ? {
          type: 'valid',
          data: {
            id: state.placement.placementId,
            terminationDate: date
          }
        }
      : { type: 'invalid-date' }
  }, [state.placement, state.terminationDate])

  const onSubmit = useCallback(
    () =>
      terminationState.type === 'valid'
        ? terminatePlacement(terminationState.data)
        : Promise.reject('Invalid params'),
    [terminationState]
  )

  const onTerminateSuccess = useCallback(() => {
    setState(emptyState())
    onSuccess()
  }, [onSuccess])

  return (
    <>
      <div>
        <Label>{t.children.placementTermination.choosePlacement}</Label>
        {placements.map((p) => (
          <Checkbox
            key={p.placementId}
            label={getPlacementLabel(p)}
            checked={state.placement?.placementId === p.placementId}
            onChange={(checked) =>
              setState((prev) => ({
                ...prev,
                placement: checked ? p : undefined
              }))
            }
          />
        ))}
      </div>
      <div>
        <ExpandingInfo
          info={t.children.placementTermination.lastDayInfo}
          ariaLabel={t.common.openExpandingInfo}
        >
          <Label>{t.children.placementTermination.lastDayOfPresence}</Label>
        </ExpandingInfo>
        <DatePicker
          hideErrorsBeforeTouched
          required
          locale={lang}
          isValidDate={isValidDate}
          info={
            terminationState.type === 'invalid-date'
              ? { text: t.validationErrors.timeFormat, status: 'warning' }
              : undefined
          }
          date={state.terminationDate ?? ''}
          onChange={(terminationDate) =>
            setState((prev) => ({ ...prev, terminationDate }))
          }
          openAbove
        />
      </div>

      <AsyncButton
        primary
        text={t.children.placementTermination.terminate}
        disabled={terminationState.type !== 'valid'}
        onClick={onSubmit}
        onSuccess={onTerminateSuccess}
      />
    </>
  )
})
