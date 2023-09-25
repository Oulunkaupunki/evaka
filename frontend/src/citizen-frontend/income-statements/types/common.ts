// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { otherIncomes } from 'lib-common/generated/api-types/incomestatement'

const attachmentType = [
  ...otherIncomes,
  'ALIMONY_PAYOUT',
  'PAYSLIP',
  'STARTUP_GRANT',
  'SALARY',
  'ACCOUNTANT_REPORT',
  'ACCOUNTANT_REPORT_LLC',
  'PROFIT_AND_LOSS_STATEMENT',
  'PROOF_OF_STUDIES',
  'CHILD_INCOME'
] as const

export type AttachmentType = (typeof attachmentType)[number]
