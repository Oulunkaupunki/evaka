// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { Failure, Success, wrapResult } from 'lib-common/api'
import { AttachmentType } from 'lib-common/generated/api-types/attachment'
import {
  ApplicationId,
  AttachmentId,
  IncomeStatementId
} from 'lib-common/generated/api-types/shared'
import { UploadHandler } from 'lib-components/molecules/FileUpload'

import { API_URL, client } from './api-client'
import { deleteAttachment as deleteAttachmentPromise } from './generated/api-clients/attachment'

function uploadHandler(url: string): UploadHandler {
  return async (file, onUploadProgress) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await client.post<AttachmentId>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: ({ loaded, total }) =>
          onUploadProgress(
            total !== undefined && total !== 0
              ? Math.round((loaded / total) * 100)
              : 0
          )
      })
      return Success.of(data)
    } catch (e) {
      return Failure.fromError(e)
    }
  }
}

export function saveIncomeStatementAttachment(
  incomeStatementId: IncomeStatementId | undefined
): UploadHandler {
  return uploadHandler(
    incomeStatementId
      ? `/citizen/attachments/income-statements/${incomeStatementId}`
      : '/citizen/attachments/income-statements'
  )
}

export const saveMessageAttachment = uploadHandler(
  '/citizen/attachments/messages'
)

export function saveApplicationAttachment(
  applicationId: ApplicationId,
  attachmentType: AttachmentType
): UploadHandler {
  return uploadHandler(
    `/citizen/attachments/applications/${applicationId}?type=${attachmentType}`
  )
}

export function getAttachmentUrl(
  attachmentId: AttachmentId,
  requestedFilename: string
): string {
  const encodedFilename = encodeURIComponent(requestedFilename)
  return `${API_URL}/citizen/attachments/${attachmentId}/download/${encodedFilename}`
}

export const deleteAttachment = wrapResult(deleteAttachmentPromise)
