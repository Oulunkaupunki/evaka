// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// GENERATED FILE: no manual modifications
/* eslint-disable import/order, prettier/prettier, @typescript-eslint/no-namespace, @typescript-eslint/no-redundant-type-constituents */

import { Absence } from 'lib-common/generated/api-types/absence'
import { AbsenceUpsert } from 'lib-common/generated/api-types/absence'
import { DeleteChildAbsenceBody } from 'lib-common/generated/api-types/absence'
import { GroupMonthCalendar } from 'lib-common/generated/api-types/absence'
import { HolidayReservationsDelete } from 'lib-common/generated/api-types/absence'
import { JsonCompatible } from 'lib-common/json'
import { JsonOf } from 'lib-common/json'
import { Presence } from 'lib-common/generated/api-types/absence'
import { UUID } from 'lib-common/types'
import { client } from '../../api/client'
import { deserializeJsonAbsence } from 'lib-common/generated/api-types/absence'
import { deserializeJsonGroupMonthCalendar } from 'lib-common/generated/api-types/absence'
import { uri } from 'lib-common/uri'


/**
* Generated from fi.espoo.evaka.absence.AbsenceController.absencesOfChild
*/
export async function absencesOfChild(
  request: {
    childId: UUID,
    year: number,
    month: number
  }
): Promise<Absence[]> {
  const { data: json } = await client.request<JsonOf<Absence[]>>({
    url: uri`/absences/by-child/${request.childId}`.toString(),
    method: 'GET',
    params: {
      year: request.year,
      month: request.month
    }
  })
  return json.map(e => deserializeJsonAbsence(e))
}


/**
* Generated from fi.espoo.evaka.absence.AbsenceController.addPresences
*/
export async function addPresences(
  request: {
    groupId: UUID,
    body: Presence[]
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/absences/${request.groupId}/present`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<Presence[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.absence.AbsenceController.deleteAbsence
*/
export async function deleteAbsence(
  request: {
    childId: UUID,
    body: DeleteChildAbsenceBody
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/absences/by-child/${request.childId}/delete`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<DeleteChildAbsenceBody>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.absence.AbsenceController.deleteHolidayReservations
*/
export async function deleteHolidayReservations(
  request: {
    groupId: UUID,
    body: HolidayReservationsDelete[]
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/absences/${request.groupId}/delete-holiday-reservations`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<HolidayReservationsDelete[]>
  })
  return json
}


/**
* Generated from fi.espoo.evaka.absence.AbsenceController.futureAbsencesOfChild
*/
export async function futureAbsencesOfChild(
  request: {
    childId: UUID
  }
): Promise<Absence[]> {
  const { data: json } = await client.request<JsonOf<Absence[]>>({
    url: uri`/absences/by-child/${request.childId}/future`.toString(),
    method: 'GET'
  })
  return json.map(e => deserializeJsonAbsence(e))
}


/**
* Generated from fi.espoo.evaka.absence.AbsenceController.groupMonthCalendar
*/
export async function groupMonthCalendar(
  request: {
    groupId: UUID,
    year: number,
    month: number,
    includeNonOperationalDays: boolean
  }
): Promise<GroupMonthCalendar> {
  const { data: json } = await client.request<JsonOf<GroupMonthCalendar>>({
    url: uri`/absences/${request.groupId}`.toString(),
    method: 'GET',
    params: {
      year: request.year,
      month: request.month,
      includeNonOperationalDays: request.includeNonOperationalDays
    }
  })
  return deserializeJsonGroupMonthCalendar(json)
}


/**
* Generated from fi.espoo.evaka.absence.AbsenceController.upsertAbsences
*/
export async function upsertAbsences(
  request: {
    groupId: UUID,
    body: AbsenceUpsert[]
  }
): Promise<void> {
  const { data: json } = await client.request<JsonOf<void>>({
    url: uri`/absences/${request.groupId}`.toString(),
    method: 'POST',
    data: request.body satisfies JsonCompatible<AbsenceUpsert[]>
  })
  return json
}