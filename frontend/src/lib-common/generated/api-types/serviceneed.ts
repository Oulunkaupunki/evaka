// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications
/* eslint-disable import/order, prettier/prettier */

import HelsinkiDateTime from '../../helsinki-date-time'
import LocalDate from '../../local-date'
import { PlacementType } from './placement'
import { UUID } from '../../types'

/**
* Generated from fi.espoo.evaka.serviceneed.ServiceNeed
*/
export interface ServiceNeed {
  confirmed: ServiceNeedConfirmation | null
  endDate: LocalDate
  id: UUID
  option: ServiceNeedOptionSummary
  placementId: UUID
  shiftCare: boolean
  startDate: LocalDate
  updated: HelsinkiDateTime
}

/**
* Generated from fi.espoo.evaka.serviceneed.ServiceNeedConfirmation
*/
export interface ServiceNeedConfirmation {
  at: HelsinkiDateTime | null
  name: string
  userId: UUID
}

/**
* Generated from fi.espoo.evaka.serviceneed.ServiceNeedController.ServiceNeedCreateRequest
*/
export interface ServiceNeedCreateRequest {
  endDate: LocalDate
  optionId: UUID
  placementId: UUID
  shiftCare: boolean
  startDate: LocalDate
}

/**
* Generated from fi.espoo.evaka.serviceneed.ServiceNeedOption
*/
export interface ServiceNeedOption {
  active: boolean
  contractDaysPerMonth: number | null
  daycareHoursPerWeek: number
  defaultOption: boolean
  feeCoefficient: number
  feeDescriptionFi: string
  feeDescriptionSv: string
  id: UUID
  nameEn: string
  nameFi: string
  nameSv: string
  occupancyCoefficient: number
  occupancyCoefficientUnder3y: number
  partDay: boolean
  partWeek: boolean
  updated: HelsinkiDateTime
  validPlacementType: PlacementType
  voucherValueDescriptionFi: string
  voucherValueDescriptionSv: string
}

/**
* Generated from fi.espoo.evaka.serviceneed.ServiceNeedOptionPublicInfo
*/
export interface ServiceNeedOptionPublicInfo {
  id: UUID
  nameEn: string
  nameFi: string
  nameSv: string
  validPlacementType: PlacementType
}

/**
* Generated from fi.espoo.evaka.serviceneed.ServiceNeedOptionSummary
*/
export interface ServiceNeedOptionSummary {
  id: UUID
  nameEn: string
  nameFi: string
  nameSv: string
  updated: HelsinkiDateTime
}

/**
* Generated from fi.espoo.evaka.serviceneed.ServiceNeedController.ServiceNeedUpdateRequest
*/
export interface ServiceNeedUpdateRequest {
  endDate: LocalDate
  optionId: UUID
  shiftCare: boolean
  startDate: LocalDate
}