// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ApplicationId } from 'lib-common/generated/api-types/shared'
import { Queries } from 'lib-common/query'

import {
  createNote,
  deleteNote,
  getNotes,
  updateNote
} from '../../generated/api-clients/application'
import { getApplicationMetadata } from '../../generated/api-clients/process'

const q = new Queries()

export const applicationNotesQuery = q.query(getNotes)

export const applicationMetadataQuery = q.query(getApplicationMetadata)

export const createApplicationNote = q.mutation(createNote, [
  ({ applicationId }) => applicationNotesQuery({ applicationId })
])

export const updateApplicationNote = q.parametricMutation<{
  applicationId: ApplicationId
}>()(updateNote, [
  ({ applicationId }) => applicationNotesQuery({ applicationId })
])

export const deleteApplicationNote = q.parametricMutation<{
  applicationId: ApplicationId
}>()(deleteNote, [
  ({ applicationId }) => applicationNotesQuery({ applicationId })
])
