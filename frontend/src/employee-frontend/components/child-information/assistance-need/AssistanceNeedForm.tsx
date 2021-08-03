// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { FormEvent, useContext, useEffect, useState } from 'react'
import styled from 'styled-components'
import LocalDate from 'lib-common/local-date'
import { UpdateStateFn } from 'lib-common/form-state'
import { useTranslation } from '../../../state/i18n'
import { UIContext } from '../../../state/ui'
import { Gap } from 'lib-components/white-space'
import Checkbox from 'lib-components/atoms/form/Checkbox'
import InputField from 'lib-components/atoms/form/InputField'
import TextArea from 'lib-components/atoms/form/TextArea'
import { AssistanceBasisOption, AssistanceNeed } from '../../../types/child'
import { UUID } from '../../../types'
import { formatDecimal } from 'lib-common/utils/number'
import { textAreaRows } from '../../utils'

import { DatePickerDeprecated } from 'lib-components/molecules/DatePickerDeprecated'
import {
  FormErrors,
  formHasErrors,
  isDateRangeInverted
} from '../../../utils/validation/validations'
import LabelValueList from '../../../components/common/LabelValueList'
import FormActions from '../../../components/common/FormActions'
import { ChildContext } from '../../../state'
import { DateRange, rangeContainsDate } from '../../../utils/date'
import { AlertBox } from 'lib-components/molecules/MessageBoxes'
import { DivFitContent } from '../../common/styled/containers'
import {
  AssistanceNeedRequest,
  createAssistanceNeed,
  updateAssistanceNeed
} from '../../../api/child/assistance-needs'
import ExpandingInfo from 'lib-components/molecules/ExpandingInfo'
import { featureFlags } from 'lib-customizations/employee'

const CheckboxRow = styled.div`
  display: flex;
  align-items: baseline;
  margin: 4px 0;
`

const CoefficientInputContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: left;
  width: 100px;
  position: relative;

  > div.field {
    margin-bottom: 0;
    padding-bottom: 0;

    div.is-error span.icon {
      display: none;
    }
  }
`

interface FormState {
  startDate: LocalDate
  endDate: LocalDate
  capacityFactor: string
  description: string
  bases: Set<string>
  otherSelected: boolean
  otherBasis: string
}

const coefficientRegex = /^\d(([.,])(\d){1,2})?$/

interface CommonProps {
  onReload: () => undefined | void
  assistanceBasisOptions: AssistanceBasisOption[]
}

interface CreateProps extends CommonProps {
  childId: UUID
}

interface UpdateProps extends CommonProps {
  assistanceNeed: AssistanceNeed
}

interface DuplicateProps extends CommonProps, CreateProps {
  assistanceNeed: AssistanceNeed
}

type Props = CreateProps | UpdateProps | DuplicateProps

function isCreate(props: Props): props is CreateProps {
  return (props as CreateProps).childId !== undefined
}

function isDuplicate(props: Props): props is DuplicateProps {
  return (
    isCreate(props) && (props as DuplicateProps).assistanceNeed !== undefined
  )
}

interface AssistanceNeedFormErrors extends FormErrors {
  dateRange: {
    inverted: boolean
    conflict: boolean
  }
  coefficient: boolean
}

const noErrors: AssistanceNeedFormErrors = {
  dateRange: {
    inverted: false,
    conflict: false
  },
  coefficient: false
}

function AssistanceNeedForm(props: Props) {
  const { i18n } = useTranslation()
  const { clearUiMode, setErrorMessage } = useContext(UIContext)
  const { assistanceNeeds } = useContext(ChildContext)

  const initialFormState: FormState =
    isCreate(props) && !isDuplicate(props)
      ? {
          startDate: LocalDate.today(),
          endDate: LocalDate.today(),
          capacityFactor: '1',
          description: '',
          bases: new Set(),
          otherSelected: false,
          otherBasis: ''
        }
      : {
          ...props.assistanceNeed,
          capacityFactor: formatDecimal(props.assistanceNeed.capacityFactor),
          otherSelected: props.assistanceNeed.otherBasis !== ''
        }
  const [form, setForm] = useState<FormState>(initialFormState)

  const [formErrors, setFormErrors] =
    useState<AssistanceNeedFormErrors>(noErrors)

  const [autoCutWarning, setAutoCutWarning] = useState<boolean>(false)

  const getExistingAssistanceNeedRanges = (): DateRange[] =>
    assistanceNeeds
      .map((needs) =>
        needs
          .filter((sn) => isCreate(props) || sn.id != props.assistanceNeed.id)
          .map(({ startDate, endDate }) => ({ startDate, endDate }))
      )
      .getOrElse([])

  const checkSoftConflict = (): boolean => {
    if (isDateRangeInverted(form)) return false
    return getExistingAssistanceNeedRanges().some((existing) =>
      rangeContainsDate(existing, form.startDate)
    )
  }

  const checkHardConflict = (): boolean => {
    if (isDateRangeInverted(form)) return false
    return getExistingAssistanceNeedRanges().some((existing) =>
      rangeContainsDate(form, existing.startDate)
    )
  }

  const checkAnyConflict = () => checkHardConflict() || checkSoftConflict()

  const updateFormState: UpdateStateFn<FormState> = (values) => {
    const newState = { ...form, ...values }
    setForm(newState)
  }

  useEffect(() => {
    setFormErrors({
      dateRange: {
        inverted: isDateRangeInverted(form),
        conflict: isCreate(props) ? checkHardConflict() : checkAnyConflict()
      },
      coefficient:
        !coefficientRegex.test(form.capacityFactor) ||
        Number(form.capacityFactor.replace(',', '.')) < 1
    })

    setAutoCutWarning(
      isCreate(props) && checkSoftConflict() && !checkHardConflict()
    )
  }, [form, assistanceNeeds]) // eslint-disable-line react-hooks/exhaustive-deps

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (formHasErrors(formErrors)) return

    const data: AssistanceNeedRequest = {
      ...form,
      capacityFactor: Number(form.capacityFactor.replace(',', '.')),
      bases: [...form.bases],
      otherBasis: form.otherSelected ? form.otherBasis : ''
    }

    const apiCall = isCreate(props)
      ? createAssistanceNeed(props.childId, data)
      : updateAssistanceNeed(props.assistanceNeed.id, data)

    void apiCall.then((res) => {
      if (res.isSuccess) {
        clearUiMode()
        props.onReload()
      } else if (res.isFailure) {
        if (res.statusCode == 409) {
          setFormErrors({
            ...formErrors,
            dateRange: {
              ...formErrors.dateRange,
              conflict: true
            }
          })
        } else {
          setErrorMessage({
            type: 'error',
            title: i18n.common.error.unknown,
            resolveLabel: i18n.common.ok
          })
        }
      }
    })
  }

  return (
    <form onSubmit={submitForm}>
      <LabelValueList
        spacing="large"
        contents={[
          {
            label: i18n.childInformation.assistanceNeed.fields.dateRange,
            value: (
              <>
                <DivFitContent>
                  <DatePickerDeprecated
                    date={form.startDate}
                    onChange={(startDate) => updateFormState({ startDate })}
                  />
                  {' - '}
                  <DatePickerDeprecated
                    date={form.endDate}
                    onChange={(endDate) => updateFormState({ endDate })}
                  />
                </DivFitContent>

                {formErrors.dateRange.inverted && (
                  <span className="error">
                    {i18n.validationError.invertedDateRange}
                  </span>
                )}
                {formErrors.dateRange.conflict && (
                  <span className="error">
                    {isCreate(props)
                      ? i18n.childInformation.assistanceNeed.errors.hardConflict
                      : i18n.childInformation.assistanceNeed.errors.conflict}
                  </span>
                )}
              </>
            )
          },
          {
            label: i18n.childInformation.assistanceNeed.fields.capacityFactor,
            value: (
              <>
                <ExpandingInfo
                  info={
                    i18n.childInformation.assistanceNeed.fields
                      .capacityFactorInfo
                  }
                  ariaLabel={
                    i18n.childInformation.assistanceNeed.fields.capacityFactor
                  }
                  fullWidth={true}
                >
                  <CoefficientInputContainer>
                    <InputField
                      value={form.capacityFactor.toString()}
                      onChange={(value) =>
                        updateFormState({
                          capacityFactor: value
                        })
                      }
                      info={
                        formErrors.coefficient
                          ? { text: 'Virheellinen arvo', status: 'warning' }
                          : undefined
                      }
                      data-qa="input-assistance-need-multiplier"
                    />
                  </CoefficientInputContainer>
                  {formErrors.coefficient && (
                    <span className="error">
                      {
                        i18n.childInformation.assistanceNeed.errors
                          .invalidCoefficient
                      }
                    </span>
                  )}
                </ExpandingInfo>
              </>
            )
          },
          {
            label: i18n.childInformation.assistanceNeed.fields.description,
            value: (
              <TextArea
                value={form.description}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                  updateFormState({ description: event.target.value })
                }
                rows={textAreaRows(form.description)}
                placeholder={
                  i18n.childInformation.assistanceNeed.fields
                    .descriptionPlaceholder
                }
              />
            ),
            valueWidth: '100%'
          },
          {
            label: i18n.childInformation.assistanceNeed.fields.bases,
            value: (
              <div>
                {props.assistanceBasisOptions.map((basis) =>
                  basis.descriptionFi ? (
                    <ExpandingInfo
                      key={basis.value}
                      info={basis.descriptionFi}
                      ariaLabel={''}
                      fullWidth={true}
                    >
                      <CheckboxRow key={basis.value}>
                        <Checkbox
                          label={basis.nameFi}
                          checked={form.bases.has(basis.value)}
                          onChange={(value) => {
                            const bases = new Set([...form.bases])
                            if (value) bases.add(basis.value)
                            else bases.delete(basis.value)
                            updateFormState({ bases: bases })
                          }}
                        />
                      </CheckboxRow>
                    </ExpandingInfo>
                  ) : (
                    <CheckboxRow key={basis.value}>
                      <Checkbox
                        label={basis.nameFi}
                        checked={form.bases.has(basis.value)}
                        onChange={(value) => {
                          const bases = new Set([...form.bases])
                          if (value) bases.add(basis.value)
                          else bases.delete(basis.value)
                          updateFormState({ bases: bases })
                        }}
                      />
                    </CheckboxRow>
                  )
                )}
                {featureFlags.assistanceBasisOtherEnabled ? (
                  <CheckboxRow>
                    <Checkbox
                      label={
                        i18n.childInformation.assistanceNeed.fields.basisTypes
                          .OTHER
                      }
                      checked={form.otherSelected}
                      onChange={(value) =>
                        updateFormState({
                          otherSelected: value,
                          otherBasis: ''
                        })
                      }
                    ></Checkbox>
                  </CheckboxRow>
                ) : null}
                {form.otherSelected && (
                  <div style={{ width: '100%' }}>
                    <InputField
                      value={form.otherBasis}
                      onChange={(value) =>
                        updateFormState({ otherBasis: value })
                      }
                      placeholder={
                        i18n.childInformation.assistanceNeed.fields
                          .otherBasisPlaceholder
                      }
                    />
                  </div>
                )}
              </div>
            ),
            valueWidth: '100%'
          }
        ]}
      />

      {autoCutWarning && (
        <>
          <Gap size="xs" />
          <AlertBox
            message={i18n.childInformation.assistanceNeed.errors.autoCutWarning}
            thin
            wide
          />
        </>
      )}

      <Gap size="s" />
      <FormActions
        onCancel={() => clearUiMode()}
        disabled={formHasErrors(formErrors)}
        data-qa="button-assistance-need-confirm"
      />
    </form>
  )
}

export default AssistanceNeedForm
