// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import Container, {
  ContentArea
} from '@evaka/lib-components/src/layout/Container'
import { ApplicationFormData } from '~applications/editor/ApplicationFormData'
import { H1, P } from '@evaka/lib-components/src/typography'
import { useTranslation } from '~localization'
import BasicsSection from '~applications/editor/verification/BasicsSection'
import { defaultMargins, Gap } from '@evaka/lib-components/src/white-space'
import HorizontalLine from '@evaka/lib-components/src/atoms/HorizontalLine'
import UnitPreferenceSection from '~applications/editor/verification/UnitPreferenceSection'
import { ApplicationDetails } from '@evaka/lib-common/src/api-types/application/ApplicationDetails'
import ServiceNeedSection from './ServiceNeedSection'
import { espooBrandColors } from '@evaka/lib-components/src/colors'
import styled from 'styled-components'
import RoundIcon from '@evaka/lib-components/src/atoms/RoundIcon'
import { faInfo } from '@evaka/lib-icons'
import ContactInfoSection from './ContactInfoSection'

type DaycareApplicationVerificationViewProps = {
  application: ApplicationDetails
  formData: ApplicationFormData
}

const applicationType = 'DAYCARE'

const AttachmentBox = styled.div`
  border: 2px solid ${espooBrandColors.espooTurquoise};
  padding: 0 ${defaultMargins.m};
  display: flex;
`

const RoundIconStyled = styled(RoundIcon)`
  margin: ${defaultMargins.m} ${defaultMargins.m} 0 0;
`

export default React.memo(function ApplicationVerificationViewDaycare({
  application,
  formData
}: DaycareApplicationVerificationViewProps) {
  const t = useTranslation()
  return (
    <Container>
      <ContentArea opaque>
        <H1>{t.applications.editor.verification.title[applicationType]}</H1>
        <P
          dangerouslySetInnerHTML={{
            __html: t.applications.editor.verification.notYetSent
          }}
        />
        {(formData.serviceNeed.urgent &&
          formData.serviceNeed.urgencyAttachments.length === 0) ||
          (formData.serviceNeed.shiftCare &&
            formData.serviceNeed.shiftCareAttachments.length === 0 && (
              <AttachmentBox>
                <RoundIconStyled
                  content={faInfo}
                  color={espooBrandColors.espooTurquoise}
                  size="s"
                />
                <div>
                  <P>
                    <strong>Huom!</strong> Jos lisäät liitteet seuraaviin
                    kohtiin sähköisesti, hakemuksesi käsitellään nopeammin,
                    sillä käsittelyaika alkaa liitteiden saapumisesta.
                  </P>
                  <ul>
                    {formData.serviceNeed.urgencyAttachments.length === 0 && (
                      <li>Hakemus on kiireellinen</li>
                    )}
                    {formData.serviceNeed.shiftCareAttachments.length === 0 && (
                      <li>Ilta- ja vuorohoito</li>
                    )}
                  </ul>
                  <P>
                    Palaa <a>takaisin hakemusnäkymään</a> lisätäksesi liitteet
                    hakemukseen.
                  </P>
                </div>
              </AttachmentBox>
            ))}
      </ContentArea>

      <Gap size="m" />

      <ContentArea opaque>
        <BasicsSection application={application} formData={formData} />
        <HorizontalLine />
        <ServiceNeedSection formData={formData} />
        <HorizontalLine />
        <UnitPreferenceSection formData={formData.unitPreference} />
        <HorizontalLine />
        <ContactInfoSection formData={formData.contactInfo} />
      </ContentArea>
    </Container>
  )
})
