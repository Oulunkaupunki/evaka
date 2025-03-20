// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useState } from 'react'
import styled from 'styled-components'

import { CaretakerAmount } from 'lib-common/generated/api-types/daycare'
import { DaycareId, GroupId } from 'lib-common/generated/api-types/shared'
import LocalDate from 'lib-common/local-date'
import { first, second, useSelectMutation } from 'lib-common/query'
import InputField from 'lib-components/atoms/form/InputField'
import {
  DatePickerDeprecated,
  DatePickerClearableDeprecated
} from 'lib-components/molecules/DatePickerDeprecated'
import { AlertBox } from 'lib-components/molecules/MessageBoxes'
import { MutateFormModal } from 'lib-components/molecules/modals/FormModal'
import { faPen, faPlus } from 'lib-icons'

import { useTranslation } from '../../../state/i18n'

import { createCaretakersMutation, updateCaretakersMutation } from './queries'

const NumberInputContainer = styled.div`
  width: 150px;
`

const numberRegex = /^\d{1,2}(([.,])(\d))?$/

interface FormState {
  startDate: LocalDate
  endDate: LocalDate | null
  amount: string
}

interface Props {
  unitId: DaycareId
  groupId: GroupId
  existing: CaretakerAmount | null
  onSuccess: () => undefined | void
  onReject: () => undefined | void
}

function GroupCaretakersModal({
  existing,
  onSuccess,
  onReject,
  unitId,
  groupId
}: Props) {
  const { i18n } = useTranslation()

  const [form, setForm] = useState<FormState>(
    existing
      ? {
          startDate: existing.startDate,
          endDate: existing.endDate,
          amount: existing.amount.toLocaleString()
        }
      : {
          startDate: LocalDate.todayInSystemTz(),
          endDate: null,
          amount: '3'
        }
  )
  const [conflict, setConflict] = useState<boolean>(false)

  const assignForm = <K extends keyof FormState>(
    values: Pick<FormState, K>
  ) => {
    setForm({
      ...form,
      ...values
    })
  }

  const [mutation, action] = useSelectMutation(
    () => (existing ? first(existing.id) : second()),
    [
      updateCaretakersMutation,
      (id) => ({
        id,
        daycareId: unitId,
        groupId,
        body: {
          startDate: form.startDate,
          endDate: form.endDate,
          amount: parseFloat(form.amount)
        }
      })
    ],
    [
      createCaretakersMutation,
      () => ({
        daycareId: unitId,
        groupId,
        body: {
          startDate: form.startDate,
          endDate: form.endDate,
          amount: parseFloat(form.amount)
        }
      })
    ]
  )

  const invalidAmount =
    !numberRegex.test(form.amount) || Number(form.amount.replace(',', '.')) < 0

  const hasErrors =
    (form.endDate && form.endDate.isBefore(form.startDate)) || invalidAmount

  const editingHistory =
    existing &&
    existing.endDate &&
    existing.endDate.isBefore(LocalDate.todayInSystemTz())
  const editingActive =
    existing &&
    !existing.startDate.isAfter(LocalDate.todayInSystemTz()) &&
    !editingHistory

  return (
    <MutateFormModal
      title={existing ? i18n.groupCaretakers.edit : i18n.groupCaretakers.create}
      icon={existing ? faPen : faPlus}
      type="info"
      resolveMutation={mutation}
      resolveAction={() => {
        setConflict(false)
        return action()
      }}
      resolveLabel={i18n.common.confirm}
      resolveDisabled={hasErrors}
      rejectAction={onReject}
      rejectLabel={i18n.common.cancel}
      onSuccess={onSuccess}
      onFailure={(res) => {
        if (res.statusCode === 409) setConflict(true)
      }}
    >
      <section>
        <div className="bold">{i18n.common.form.startDate}</div>
        <DatePickerDeprecated
          date={form.startDate}
          onChange={(startDate) => assignForm({ startDate })}
          type="full-width"
        />
      </section>
      <section>
        <div className="bold">{i18n.common.form.endDate}</div>
        <DatePickerClearableDeprecated
          date={form.endDate}
          onChange={(endDate) => assignForm({ endDate })}
          onCleared={() => assignForm({ endDate: null })}
          type="full-width"
        />
      </section>
      <section>
        <div className="bold">{i18n.groupCaretakers.amount}</div>
        <NumberInputContainer>
          <InputField
            value={form.amount.toString()}
            onChange={(value) =>
              assignForm({
                amount: value
              })
            }
            info={
              invalidAmount
                ? { text: 'Virheellinen arvo', status: 'warning' }
                : undefined
            }
            data-qa="input-assistance-need-multiplier"
          />
        </NumberInputContainer>
      </section>
      {conflict && <AlertBox message={i18n.groupCaretakers.conflict} />}
      {editingHistory && (
        <AlertBox message={i18n.groupCaretakers.editHistoryWarning} />
      )}
      {editingActive && (
        <AlertBox message={i18n.groupCaretakers.editActiveWarning} />
      )}
    </MutateFormModal>
  )
}

export default GroupCaretakersModal
