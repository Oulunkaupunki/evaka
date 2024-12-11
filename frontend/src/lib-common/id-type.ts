// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { validate, v4 as uuidv4 } from 'uuid'

declare const id: unique symbol
export type Id<B extends string> = string & { [id]: B }

export function fromUuid<T extends Id<string>>(id: string): T {
  if (!validate(id)) {
    throw new Error(`Invalid UUID: ${id}`)
  }
  return id as T
}

export function fromNullableUuid<T extends Id<string>>(
  id: string | null
): T | null {
  if (id === null) return null
  return fromUuid<T>(id)
}

export function randomId<T extends Id<string>>(): T {
  return uuidv4() as T
}