// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { combine, Loading, Result } from 'lib-common/api'
import { IncomeStatementStatus } from 'lib-common/generated/api-types/incomestatement'
import LocalDate from 'lib-common/local-date'
import {
  constantQuery,
  useMutationResult,
  useQueryResult
} from 'lib-common/query'
import { UUID } from 'lib-common/types'
import useRouteParams from 'lib-common/useRouteParams'
import Main from 'lib-components/atoms/Main'

import { renderResult } from '../async-rendering'

import { IncomeStatementFormAPI } from './IncomeStatementComponents'
import IncomeStatementForm from './IncomeStatementForm'
import {
  createIncomeStatementMutation,
  incomeStatementQuery,
  incomeStatementStartDatesQuery,
  updateIncomeStatementMutation
} from './queries'
import { fromBody } from './types/body'
import * as Form from './types/form'
import { emptyIncomeStatementForm } from './types/form'

interface EditorState {
  id: string | undefined
  status: IncomeStatementStatus
  startDates: LocalDate[]
  formData: Form.IncomeStatementForm
}

function useInitialEditorState(id: UUID | undefined): Result<EditorState> {
  const incomeStatement = useQueryResult(
    id ? incomeStatementQuery({ incomeStatementId: id }) : constantQuery(null)
  )
  const startDates = useQueryResult(incomeStatementStartDatesQuery())

  return combine(incomeStatement, startDates).map(
    ([incomeStatement, startDates]) => ({
      id,
      status: incomeStatement?.status ?? 'DRAFT',
      startDates,
      formData:
        incomeStatement === null
          ? emptyIncomeStatementForm
          : Form.fromIncomeStatement(incomeStatement)
    })
  )
}

export default React.memo(function IncomeStatementEditor() {
  const params = useRouteParams(['incomeStatementId'])
  const navigate = useNavigate()
  const incomeStatementId =
    params.incomeStatementId === 'new' ? undefined : params.incomeStatementId

  const [state, setState] = useState<Result<EditorState>>(Loading.of())
  const initialEditorState = useInitialEditorState(incomeStatementId)
  if (
    state.isLoading &&
    initialEditorState.isSuccess &&
    !initialEditorState.isReloading
  ) {
    setState(initialEditorState)
  }

  const [showFormErrors, setShowFormErrors] = useState(false)

  const navigateToList = useCallback(() => {
    navigate('/income')
  }, [navigate])

  const form = useRef<IncomeStatementFormAPI | null>(null)

  const updateFormData = useCallback(
    (fn: (prev: Form.IncomeStatementForm) => Form.IncomeStatementForm): void =>
      setState((prev) =>
        prev.map((state) => ({ ...state, formData: fn(state.formData) }))
      ),
    []
  )

  const { mutateAsync: createIncomeStatement } = useMutationResult(
    createIncomeStatementMutation
  )
  const { mutateAsync: updateIncomeStatement } = useMutationResult(
    updateIncomeStatementMutation
  )

  const draftBody = useMemo(
    () => state.map((state) => fromBody('adult', state.formData, true)),
    [state]
  )

  const validatedBody = useMemo(
    () => state.map((state) => fromBody('adult', state.formData, false)),
    [state]
  )

  return renderResult(
    combine(state, draftBody, validatedBody),
    ([{ status, formData, startDates }, draftBody, validatedBody]) => {
      const save = (draft: boolean) => {
        const body = draft ? draftBody : validatedBody
        if (body) {
          if (incomeStatementId) {
            return updateIncomeStatement({ incomeStatementId, body, draft })
          } else {
            return createIncomeStatement({ body, draft })
          }
        } else {
          setShowFormErrors(true)
          if (form.current) form.current.scrollToErrors()
          return
        }
      }

      return (
        <Main>
          <IncomeStatementForm
            incomeStatementId={incomeStatementId}
            status={status}
            formData={formData}
            showFormErrors={showFormErrors}
            otherStartDates={startDates}
            draftSaveEnabled={draftBody !== null}
            onChange={updateFormData}
            onSave={save}
            onSuccess={navigateToList}
            onCancel={navigateToList}
            ref={form}
          />
        </Main>
      )
    }
  )
})
