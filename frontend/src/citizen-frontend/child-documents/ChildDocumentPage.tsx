// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useEffect } from 'react'

import Footer from 'citizen-frontend/Footer'
import { renderResult } from 'citizen-frontend/async-rendering'
import { useTranslation } from 'citizen-frontend/localization'
import { useForm } from 'lib-common/form/hooks'
import { ChildDocumentDetails } from 'lib-common/generated/api-types/document'
import { useMutation, useQueryResult } from 'lib-common/query'
import { UUID } from 'lib-common/types'
import useNonNullableParams from 'lib-common/useNonNullableParams'
import ReturnButton from 'lib-components/atoms/buttons/ReturnButton'
import DocumentView from 'lib-components/document-templates/DocumentView'
import {
  documentForm,
  getDocumentFormInitialState
} from 'lib-components/document-templates/documents'
import Content, {
  Container,
  ContentArea
} from 'lib-components/layout/Container'
import { Gap } from 'lib-components/white-space'

import { childDocumentDetailsQuery, childDocumentReadMutation } from './queries'

export default React.memo(function ChildDocumentPage() {
  const { id } = useNonNullableParams<{ id: UUID }>()

  const decision = useQueryResult(childDocumentDetailsQuery(id))
  const i18n = useTranslation()

  return (
    <>
      <Content>
        <Gap size="s" />
        <ReturnButton label={i18n.common.return} />
        <Gap size="s" />

        {renderResult(decision, (document) => (
          <ChildDocumentView document={document} />
        ))}

        <Gap size="m" />
        <ReturnButton label={i18n.common.return} />
        <Gap size="s" />
      </Content>
      <Footer />
    </>
  )
})

const ChildDocumentView = React.memo(function ChildDocumentView({
  document
}: {
  document: ChildDocumentDetails
}) {
  const i18n = useTranslation()

  const { mutateAsync: markRead } = useMutation(childDocumentReadMutation)
  useEffect(() => {
    void markRead(document.id)
  }, [markRead, document.id])

  const bind = useForm(
    documentForm,
    () =>
      getDocumentFormInitialState(document.template.content, document.content),
    i18n.validationErrors
  )

  return (
    <Container>
      <ContentArea opaque>
        <DocumentView bind={bind} readOnly hideInfos />
      </ContentArea>
    </Container>
  )
})
