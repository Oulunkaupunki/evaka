// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { MobileDeviceDetails } from 'lib-common/generated/api-types/pairing'
import { EmployeeFeatures } from '../generated/api-types/shared'
import { UUID } from '../types'

export interface User {
  id: UUID
  name: string
  accessibleFeatures: EmployeeFeatures
}

export interface MobileUser extends MobileDeviceDetails {
  pinLoginActive: boolean
}

export const globalRoles = [
  'ADMIN',
  'SERVICE_WORKER',
  'FINANCE_ADMIN',
  'REPORT_VIEWER',
  'DIRECTOR'
] as const

export type GlobalRole = typeof globalRoles[number]

export const scopedRoles = [
  'UNIT_SUPERVISOR',
  'SPECIAL_EDUCATION_TEACHER',
  'STAFF'
] as const

export type ScopedRole = typeof scopedRoles[number]

export const adRoles = [...globalRoles, ...scopedRoles] as const

export type AdRole = GlobalRole | ScopedRole

export interface AuthStatus<U extends User | MobileUser> {
  loggedIn: boolean
  user?: U
  roles?: AdRole[]
  apiVersion: string
}
