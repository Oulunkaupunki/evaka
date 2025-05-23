// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Queries } from 'lib-common/query'

import {
  getNekkuMealTypes,
  getNekkuSpecialDietFields,
  getNekkuSpecialDietOptions,
  getNekkuSpecialDiets
} from '../../../generated/api-clients/nekku'
import {
  getDiets,
  getMealTextures
} from '../../../generated/api-clients/specialdiet'

const q = new Queries()

export const specialDietsQuery = q.query(getDiets)

export const mealTexturesQuery = q.query(getMealTextures)

export const nekkuDietTypesQuery = q.query(getNekkuMealTypes)

export const nekkuSpecialDietTypesQuery = q.query(getNekkuSpecialDiets)

export const nekkuSpecialDietFieldsQuery = q.query(getNekkuSpecialDietFields)

export const nekkuSpecialDietOptionsQuery = q.query(getNekkuSpecialDietOptions)
