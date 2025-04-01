// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.document.childdocument

import fi.espoo.evaka.document.DocumentTemplate
import fi.espoo.evaka.document.DocumentType
import fi.espoo.evaka.shared.ChildDocumentId
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import fi.espoo.evaka.user.EvakaUser
import org.jdbi.v3.core.mapper.Nested
import org.jdbi.v3.json.Json

data class ChildDocumentCitizenSummary(
    val id: ChildDocumentId,
    val status: DocumentStatus,
    val type: DocumentType,
    val templateName: String,
    val publishedAt: HelsinkiDateTime,
    val unread: Boolean,
    val answeredAt: HelsinkiDateTime?,
    @Nested("answered_by") val answeredBy: EvakaUser?,
)

data class ChildDocumentCitizenDetails(
    val id: ChildDocumentId,
    val status: DocumentStatus,
    val publishedAt: HelsinkiDateTime?,
    val downloadable: Boolean,
    @Json val content: DocumentContent,
    @Nested("child") val child: ChildBasics,
    @Nested("template") val template: DocumentTemplate,
)
