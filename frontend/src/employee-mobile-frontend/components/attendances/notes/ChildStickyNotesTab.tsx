// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Result } from 'lib-common/api'
import { ChildStickyNote } from 'lib-common/generated/api-types/note'
import { UUID } from 'lib-common/types'
import { EditedNote } from 'lib-components/employee/notes/notes'
import React, { useCallback, useContext, useMemo } from 'react'
import {
  StickyNoteTab,
  StickyNoteTabLabels
} from 'lib-components/employee/notes/StickyNoteTab'
import {
  deleteChildStickyNote,
  postChildStickyNote,
  putChildStickyNote
} from '../../../api/notes'
import { ChildAttendanceContext } from '../../../state/child-attendance'
import { Translations, useTranslation } from '../../../state/i18n'

const getStickyNoteTabLabels = (i18n: Translations): StickyNoteTabLabels => ({
  addNew: i18n.attendances.notes.addNew,
  editor: {
    cancel: i18n.common.cancel,
    placeholder: i18n.attendances.notes.placeholders.childStickyNote,
    save: i18n.common.save
  },
  static: {
    edit: i18n.common.edit,
    remove: i18n.common.remove,
    validTo: i18n.common.validTo
  },
  title: i18n.attendances.notes.childStickyNotes
})

interface Props {
  childId: UUID
  notes: ChildStickyNote[]
}

export const ChildStickyNotesTab = React.memo(function ChildStickyNotesTab({
  childId,
  notes
}: Props) {
  const { i18n } = useTranslation()

  const { reloadAttendances } = useContext(ChildAttendanceContext)
  const reloadOnSuccess = useCallback(
    (res: Result<unknown>) => res.map(() => reloadAttendances()),
    [reloadAttendances]
  )
  const onSave = useCallback(
    ({ id, ...body }: EditedNote) =>
      (id
        ? putChildStickyNote(id, body)
        : postChildStickyNote(childId, body)
      ).then(reloadOnSuccess),
    [childId, reloadOnSuccess]
  )
  const onRemove = useCallback(
    (id: UUID) => deleteChildStickyNote(id).then(reloadOnSuccess),
    [reloadOnSuccess]
  )
  const labels = useMemo<StickyNoteTabLabels>(
    () => getStickyNoteTabLabels(i18n),
    [i18n]
  )

  return (
    <StickyNoteTab
      notes={notes}
      onSave={onSave}
      onRemove={onRemove}
      labels={labels}
      smallerHeading
    />
  )
})
