// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import * as ApiTypes from 'lib-common/generated/api-types/incomestatement'
import { AttachmentId } from 'lib-common/generated/api-types/shared'
import LocalDate from 'lib-common/local-date'
import { stringToInt } from 'lib-common/utils/number'

import * as Form from './form'

type ReadOnlyFields =
  | 'id'
  | 'created'
  | 'updated'
  | 'sent_at'
  | 'status'
  | 'handlerNote'

export type HighestFeeBody = Omit<
  ApiTypes.IncomeStatementBody.HighestFee,
  ReadOnlyFields
>

export interface ChildIncomeBody
  extends Omit<
    ApiTypes.IncomeStatementBody.ChildIncome,
    ReadOnlyFields | 'attachments'
  > {
  attachmentIds: AttachmentId[]
}

export interface IncomeBody
  extends Omit<
    ApiTypes.IncomeStatementBody.Income,
    ReadOnlyFields | 'attachments'
  > {
  attachmentIds: AttachmentId[]
}

export type IncomeStatementBody = HighestFeeBody | IncomeBody | ChildIncomeBody

export function fromBody(
  personType: 'adult' | 'child',
  formData: Form.IncomeStatementForm,
  draft: boolean
): IncomeStatementBody | null {
  if (!draft && !formData.assure) return null

  const startDate = formData.startDate
  if (startDate === null) return null
  if (!draft && formData.endDate && startDate > formData.endDate) return null

  if (formData.highestFee) {
    if (personType === 'child') {
      return null
    }
    return { type: 'HIGHEST_FEE', startDate, endDate: formData.endDate }
  } else {
    if (!draft && personType === 'adult' && !formData.endDate) return null
  }

  if (formData.childIncome) {
    const childIncome: ChildIncomeBody = {
      type: 'CHILD_INCOME',
      startDate,
      endDate: formData.endDate,
      otherInfo: formData.otherInfo,
      attachmentIds: formData.attachments.map((a) => a.id)
    }
    return childIncome
  }

  const gross = validateGross(formData.gross)
  const entrepreneur = validateEntrepreneur(formData.entrepreneur, draft)

  if (
    gross === invalid ||
    entrepreneur === invalid ||
    (!gross && !entrepreneur)
  ) {
    return null
  }

  return {
    type: 'INCOME' as const,
    startDate,
    endDate: formData.endDate,
    gross,
    entrepreneur,
    student: formData.student,
    alimonyPayer: formData.alimonyPayer,
    otherInfo: formData.otherInfo,
    attachmentIds: formData.attachments.map((a) => a.id)
  }
}

const invalid: unique symbol = Symbol()

function validateGross(formData: Form.Gross) {
  if (!formData.selected) return null
  if (formData.incomeSource === null) return invalid

  const estimatedMonthlyIncome =
    stringToInt(formData.estimatedMonthlyIncome) ?? invalid

  if (estimatedMonthlyIncome === invalid) return invalid

  return {
    incomeSource: formData.incomeSource,
    estimatedMonthlyIncome,
    otherIncome: formData.otherIncome ?? [],
    otherIncomeInfo: formData.otherIncomeInfo
  }
}

function validateEntrepreneur(formData: Form.Entrepreneur, draft: boolean) {
  if (!formData.selected) return null

  const {
    fullTime,
    companyName,
    businessId,
    spouseWorksInCompany,
    startupGrant,
    partnership,
    lightEntrepreneur,
    checkupConsent
  } = formData
  const startOfEntrepreneurship = formData.startOfEntrepreneurship ?? invalid

  const selfEmployed = validateSelfEmployed(formData.selfEmployed)
  const limitedCompany = validateLimitedCompany(formData.limitedCompany)

  if (
    fullTime === null ||
    startOfEntrepreneurship === invalid ||
    spouseWorksInCompany === null ||
    selfEmployed === invalid ||
    limitedCompany === invalid ||
    (!selfEmployed && !limitedCompany && !partnership && !lightEntrepreneur)
  ) {
    return invalid
  }

  const accountant =
    limitedCompany || selfEmployed || partnership
      ? validateAccountant(formData.accountant, draft)
      : null
  if (accountant === invalid) {
    return invalid
  }

  return {
    fullTime,
    startOfEntrepreneurship,
    companyName,
    businessId,
    spouseWorksInCompany,
    startupGrant,
    checkupConsent,
    selfEmployed,
    limitedCompany,
    partnership,
    lightEntrepreneur,
    accountant
  }
}

function validateSelfEmployed(formData: Form.SelfEmployed) {
  if (!formData.selected) return null
  const estimation = formData.estimation
    ? validateEstimatedIncome(formData)
    : null

  if (estimation === invalid) return invalid

  return {
    attachments: formData.attachments,
    estimatedIncome: estimation
  }
}

function validateEstimatedIncome(formData: {
  estimatedMonthlyIncome: string
  incomeStartDate: LocalDate | null
  incomeEndDate: LocalDate | null
}) {
  const estimatedMonthlyIncome =
    stringToInt(formData.estimatedMonthlyIncome) ?? invalid

  if (estimatedMonthlyIncome === invalid || !formData.incomeStartDate) {
    return invalid
  }

  if (
    formData.incomeEndDate &&
    formData.incomeStartDate > formData.incomeEndDate
  ) {
    return invalid
  }

  return {
    estimatedMonthlyIncome,
    incomeStartDate: formData.incomeStartDate,
    incomeEndDate: formData.incomeEndDate
  }
}

function validateLimitedCompany(formData: Form.LimitedCompany) {
  if (!formData.selected) return null
  if (formData.incomeSource === null) return invalid
  return { incomeSource: formData.incomeSource }
}

function validateAccountant(accountant: Form.Accountant, draft: boolean) {
  const result = {
    name: accountant.name.trim(),
    address: accountant.address.trim(),
    phone: accountant.phone.trim(),
    email: accountant.email.trim()
  }
  if (!draft && (!result.name || !result.phone || !result.email)) return invalid
  return result
}
