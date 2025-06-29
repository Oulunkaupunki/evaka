// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'

import type { ApplicationFormData } from 'lib-common/api-types/application/ApplicationFormData'
import type { ApplicationDetails as ApplicationDetailsGen } from 'lib-common/generated/api-types/application'
import ListGrid from 'lib-components/layout/ListGrid'
import { PersonName } from 'lib-components/molecules/PersonNames'
import { H2, Label } from 'lib-components/typography'

import { useTranslation } from '../../../localization'

import { ApplicationDataGridLabelWidth } from './const'

type BasicsSectionProps = {
  application: ApplicationDetailsGen
  formData: ApplicationFormData
}

export default React.memo(function BasicsSection({
  application,
  formData
}: BasicsSectionProps) {
  const t = useTranslation()

  const created = application.createdAt?.toLocalDate()

  return (
    <div>
      <H2>
        <PersonName
          person={{
            firstName: formData.contactInfo.childFirstName,
            lastName: formData.contactInfo.childLastName
          }}
          format="First Last"
        />
      </H2>

      <ListGrid
        labelWidth={ApplicationDataGridLabelWidth}
        rowGap="s"
        columnGap="L"
      >
        <Label>{t.applications.editor.verification.basics.created}</Label>
        <span>{created?.format() ?? ''}</span>
      </ListGrid>
    </div>
  )
})
