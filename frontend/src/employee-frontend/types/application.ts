// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  ApplicationAttachment,
  ApplicationDetails
} from 'lib-common/api-types/application/ApplicationDetails'
import { Action } from 'lib-common/generated/action'
import { PersonJSON } from 'lib-common/generated/api-types/pis'

import { VoucherApplicationFilter } from '../state/application-ui'

import { Decision } from './decision'

export interface ApplicationResponse {
  application: ApplicationDetails
  decisions: Decision[]
  guardians: PersonJSON[]
  attachments: ApplicationAttachment[]
  permittedActions: Set<Action.Application>
}

export type SortByApplications =
  | 'APPLICATION_TYPE'
  | 'CHILD_NAME'
  | 'DUE_DATE'
  | 'START_DATE'
  | 'STATUS'

export interface ApplicationSearchParams {
  area?: string
  units?: string
  basis?: string
  type: string
  preschoolType?: string
  status?: string
  dateType?: string
  distinctions?: string
  periodStart?: string
  periodEnd?: string
  searchTerms?: string
  transferApplications?: string
  voucherApplications: VoucherApplicationFilter
}

export type ApplicationSummaryStatus =
  | 'SENT'
  | 'WAITING_PLACEMENT'
  | 'WAITING_DECISION'
  | 'WAITING_UNIT_CONFIRMATION'
  | 'WAITING_MAILING'
  | 'WAITING_CONFIRMATION'
  | 'REJECTED'
  | 'ACTIVE'
  | 'CANCELLED'
