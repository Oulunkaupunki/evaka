// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import LocalDate from 'lib-common/local-date'
import { AttendanceStatus } from 'lib-common/generated/api-types/attendance'
import { Translations } from '../state/i18n'
import { PlacementType } from 'lib-common/generated/enums'

export interface User {
  id: string
  name: string
  unitId?: string // only mobile devices have this
}

export type ChildAttendanceUIState =
  | 'coming'
  | 'present'
  | 'departed'
  | 'absent'

export function mapChildAttendanceUIState(
  uiState: ChildAttendanceUIState
): AttendanceStatus {
  switch (uiState) {
    case 'coming':
      return 'COMING'
    case 'present':
      return 'PRESENT'
    case 'departed':
      return 'DEPARTED'
    case 'absent':
      return 'ABSENT'
  }
}

export type AdRole =
  | 'SERVICE_WORKER'
  | 'UNIT_SUPERVISOR'
  | 'STAFF'
  | 'FINANCE_ADMIN'
  | 'ADMIN'
  | 'DIRECTOR'
  | 'SPECIAL_EDUCATION_TEACHER'

export type AbsenceType =
  | 'OTHER_ABSENCE'
  | 'SICKLEAVE'
  | 'UNKNOWN_ABSENCE'
  | 'PLANNED_ABSENCE'
  | 'TEMPORARY_RELOCATION'
  | 'TEMPORARY_VISITOR'
  | 'PARENTLEAVE'
  | 'FORCE_MAJEURE'
  | 'PRESENCE'

export const AbsenceTypes: AbsenceType[] = [
  'OTHER_ABSENCE',
  'SICKLEAVE',
  'UNKNOWN_ABSENCE',
  'PLANNED_ABSENCE',
  'PARENTLEAVE',
  'FORCE_MAJEURE',
  'PRESENCE'
]

export type CareType =
  | 'SCHOOL_SHIFT_CARE'
  | 'PRESCHOOL'
  | 'PRESCHOOL_DAYCARE'
  | 'DAYCARE_5YO_FREE'
  | 'DAYCARE'
  | 'CLUB'

export function formatCareType(
  careType: CareType,
  placementType: PlacementType,
  i18n: Translations
) {
  const isPreparatory =
    placementType === 'PREPARATORY' || placementType === 'PREPARATORY_DAYCARE'

  if (
    careType === 'DAYCARE' &&
    fiveYearOldPlacementTypes.includes(placementType)
  ) {
    return i18n.common.types.DAYCARE_5YO_PAID
  }

  if (isPreparatory && careType === 'PRESCHOOL')
    return i18n.common.types.PREPARATORY_EDUCATION

  return i18n.absences.careTypes[careType]
}

const fiveYearOldPlacementTypes = [
  'DAYCARE_FIVE_YEAR_OLDS',
  'DAYCARE_PART_TIME_FIVE_YEAR_OLDS'
]

export interface AbsenceBackupCare {
  childId: string
  date: LocalDate
}
