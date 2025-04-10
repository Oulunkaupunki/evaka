// SPDX-FileCopyrightText: 2017-2025 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.document.archival

import fi.espoo.evaka.document.childdocument.ChildDocumentDetails
import fi.espoo.evaka.identity.ExternalIdentifier
import fi.espoo.evaka.process.ArchivedProcess
import fi.espoo.evaka.process.ArchivedProcessState
import fi.espoo.evaka.process.DocumentMetadata
import fi.espoo.evaka.sarma.model.*
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import jakarta.xml.bind.JAXBContext
import java.io.StringWriter
import java.time.ZoneId
import javax.xml.datatype.DatatypeFactory
import javax.xml.datatype.XMLGregorianCalendar

private fun HelsinkiDateTime.asXMLGregorianCalendar(): XMLGregorianCalendar {
    val zdt = this.toLocalDateTime().atZone(ZoneId.of("Europe/Helsinki"))
    return DatatypeFactory.newInstance()
        .newXMLGregorianCalendar(
            zdt.year,
            zdt.monthValue,
            zdt.dayOfMonth,
            javax.xml.datatype.DatatypeConstants.FIELD_UNDEFINED,
            javax.xml.datatype.DatatypeConstants.FIELD_UNDEFINED,
            javax.xml.datatype.DatatypeConstants.FIELD_UNDEFINED,
            javax.xml.datatype.DatatypeConstants.FIELD_UNDEFINED,
            javax.xml.datatype.DatatypeConstants.FIELD_UNDEFINED,
        )
}

fun marshalMetadata(metadata: RecordMetadataInstance): String {
    val context = JAXBContext.newInstance(RecordMetadataInstance::class.java)
    val marshaller =
        context.createMarshaller().apply {
            // Use namespaces in a similar way as the shared example xml files. TODO check
            // if this
            // is actually needed
            setProperty(
                "org.glassfish.jaxb.namespacePrefixMapper",
                object : org.glassfish.jaxb.runtime.marshaller.NamespacePrefixMapper() {
                    override fun getPreferredPrefix(
                        namespaceUri: String,
                        suggestion: String?,
                        requirePrefix: Boolean,
                    ): String {
                        return when (namespaceUri) {
                            "http://www.avaintec.com/2005/x-archive/record-metadata-instance/2.0" ->
                                "ns0"
                            "http://www.avaintec.com/2004/records-schedule-fi/1.0" -> "at0"
                            else -> suggestion ?: "ns"
                        }
                    }
                },
            )
        }
    return StringWriter().use { writer ->
        marshaller.marshal(metadata, writer)
        writer.toString()
    }
}

private fun createPolicyRule(
    timeSpan: Short,
    triggerEvent: String,
    action: PolicyConfiguration.Rules.Rule.Action,
): PolicyConfiguration.Rules.Rule {
    return PolicyConfiguration.Rules.Rule().apply {
        this.timeSpan = timeSpan
        this.triggerEvent = triggerEvent
        this.action = action
    }
}

private fun createPolicyAction(
    actionType: String,
    actionArgument: String? = null,
    actionAnnotation: String? = null,
): PolicyConfiguration.Rules.Rule.Action {
    return PolicyConfiguration.Rules.Rule.Action().apply {
        this.actionType = actionType
        if (actionArgument != null) {
            actionArguments =
                PolicyConfiguration.Rules.Rule.Action.ActionArguments().apply {
                    this.actionArgument = actionArgument
                }
        }
        if (actionAnnotation != null) {
            this.actionAnnotation = actionAnnotation
        }
    }
}

private fun createDisclosurePolicy(documentMetadata: DocumentMetadata): DisclosurePolicyType {
    return DisclosurePolicyType().apply {
        policyConfiguration =
            PolicyConfiguration().apply {
                policyName = "DisclosurePolicy"
                initialTargetState =
                    if (documentMetadata.confidential == true) "confidential" else "public"
                rules =
                    PolicyConfiguration.Rules().apply {
                        rule =
                            createPolicyRule(
                                // according to Särmä specs, this should be set to 0 for
                                // public and permanently confidential documents. If not
                                // defined in metadata, we default to 100 years.
                                timeSpan =
                                    if (documentMetadata.confidential == true)
                                        documentMetadata.confidentiality?.durationYears?.toShort()
                                            ?: 100
                                    else 0,
                                // years from document creation (creation.created in xml)
                                triggerEvent = "YearsFromRecordCreation",
                                action =
                                    createPolicyAction(
                                        actionType = "SetTargetStateToArgument",
                                        actionArgument = "public",
                                        actionAnnotation =
                                            documentMetadata.confidentiality?.basis
                                                ?: "JulkL 24 § 1 mom. 32 k",
                                    ),
                            )
                    }
            }
    }
}

private fun createInformationSecurityPolicy(): InformationSecurityPolicyType {
    return InformationSecurityPolicyType().apply {
        policyConfiguration =
            PolicyConfiguration().apply {
                policyName = "InformationSecurityPolicy"
                initialTargetState = "notSecurityClassified"
                rules =
                    PolicyConfiguration.Rules().apply {
                        rule =
                            createPolicyRule(
                                timeSpan = 0,
                                triggerEvent = "InPerpetuity",
                                action =
                                    createPolicyAction(
                                        actionType = "SetTargetStateToArgument",
                                        actionArgument = "notSecurityClassified",
                                    ),
                            )
                    }
            }
    }
}

private fun createRetentionPolicy(): RetentionPolicyType {
    return RetentionPolicyType().apply {
        policyConfiguration =
            PolicyConfiguration().apply {
                policyName = "RetentionPolicy"
                rules =
                    PolicyConfiguration.Rules().apply {
                        rule =
                            createPolicyRule(
                                timeSpan = 0,
                                triggerEvent = "InPerpetuity",
                                action =
                                    createPolicyAction(
                                        actionType = "AddTimeSpanToTarget",
                                        actionAnnotation = "KA/13089/07.01.01.03.01/2018",
                                    ),
                            )
                    }
            }
    }
}

private fun createProtectionPolicy(): ProtectionPolicyType {
    return ProtectionPolicyType().apply {
        policyConfiguration =
            PolicyConfiguration().apply {
                policyName = "ProtectionPolicy"
                initialTargetState = "3"
                rules =
                    PolicyConfiguration.Rules().apply {
                        rule =
                            createPolicyRule(
                                timeSpan = 0,
                                triggerEvent = "InPerpetuity",
                                action =
                                    createPolicyAction(
                                        actionType = "SetTargetStateToArgument",
                                        actionArgument = "3",
                                    ),
                            )
                    }
            }
    }
}

private fun createAgents(
    archivedProcess: ArchivedProcess?
): StandardMetadataType.DocumentDescription.Agents {
    return StandardMetadataType.DocumentDescription.Agents().apply {
        // Get unique agents by their ID to avoid duplicates
        archivedProcess
            ?.history
            ?.map { it.enteredBy }
            ?.distinctBy { it.id }
            ?.forEach { user ->
                agent.add(
                    AgentType().apply {
                        corporateName = archivedProcess.organization
                        role = "Henkilökunta" // TODO pitäisikö tämän olla tarkempi rooli?
                        name = user.name
                    }
                )
            }
    }
}

private fun createDocumentDescription(
    document: ChildDocumentDetails,
    documentMetadata: DocumentMetadata,
    archivedProcess: ArchivedProcess?,
    childIdentifier: ExternalIdentifier,
    childBirthDate: java.time.LocalDate,
): StandardMetadataType.DocumentDescription {
    return StandardMetadataType.DocumentDescription().apply {
        // Basic document info
        title = documentMetadata.name
        documentType = "Suunnitelma" // From Evaka_Särmä_metatietomääritykset.xlsx
        documentTypeSpecifier =
            "Varhaiskasvatussuunnitelma" // From Evaka_Särmä_metatietomääritykset.xlsx
        personalData = PersonalDataType.CONTAINS_PERSONAL_INFORMATION // TODO md_instance.xml:
        // containsPersonalInformation tai
        // containsSensitivePersonalInformation.
        // Mistä tämä tulisi päätellä?
        language = document.template.language.isoLanguage.alpha2

        // From Evaka_Särmä_metatietomääritykset.xlsx
        dataManagement = "Palvelujen tiedonhallinta"
        dataSource = "Varhaiskasvatuksen tietovaranto"
        registerName = "Varhaiskasvatuksen asiakastietorekisteri"
        personalDataCollectionReason =
            "Rekisterinpitäjän lakisääteisten velvoitteiden noudattaminen"

        // Child's information
        firstName = document.child.firstName
        lastName = document.child.lastName
        socialSecurityNumber =
            if (childIdentifier is ExternalIdentifier.SSN) childIdentifier.ssn else null
        birthDate =
            childBirthDate.let { date ->
                DatatypeFactory.newInstance()
                    .newXMLGregorianCalendar(
                        date.year,
                        date.monthValue,
                        date.dayOfMonth,
                        javax.xml.datatype.DatatypeConstants.FIELD_UNDEFINED,
                        javax.xml.datatype.DatatypeConstants.FIELD_UNDEFINED,
                        javax.xml.datatype.DatatypeConstants.FIELD_UNDEFINED,
                        javax.xml.datatype.DatatypeConstants.FIELD_UNDEFINED,
                        javax.xml.datatype.DatatypeConstants.FIELD_UNDEFINED,
                    )
            }
        agents = createAgents(archivedProcess)
    }
}

private fun createFormat(filename: String): StandardMetadataType.Format {
    return StandardMetadataType.Format().apply {
        recordType = ResourceTypeType.DIGITAL
        mimeType = AcceptedMimeTypeType.APPLICATION_PDF
        this.fileName = filename
        fileFormat = AcceptedFileFormatType.NOT_APPLICABLE
    }
}

private fun createCreation(documentMetadata: DocumentMetadata): StandardMetadataType.Creation {
    return StandardMetadataType.Creation().apply {
        created = documentMetadata.createdAt?.asXMLGregorianCalendar()
        originatingSystem = "Varhaiskasvatuksen toiminnanohjausjärjestelmä"
    }
}

private fun createPolicies(documentMetadata: DocumentMetadata): StandardMetadataType.Policies {
    return StandardMetadataType.Policies().apply {
        // Salassapitosääntö
        disclosurePolicy = createDisclosurePolicy(documentMetadata)
        // Turvallisuussääntö
        informationSecurityPolicy = createInformationSecurityPolicy()
        // Säilytyssääntö
        retentionPolicy = createRetentionPolicy()
        // Suojeluluokkasääntö
        protectionPolicy = createProtectionPolicy()
    }
}

private fun createCaseFile(
    documentMetadata: DocumentMetadata,
    archivedProcess: ArchivedProcess?,
): CaseFileType {
    return CaseFileType().apply {
        caseCreated = documentMetadata.createdAt?.asXMLGregorianCalendar()
        caseFinished =
            archivedProcess
                ?.history
                ?.find { it.state == ArchivedProcessState.COMPLETED }
                ?.enteredAt
                ?.asXMLGregorianCalendar()
    }
}

fun createDocumentMetadata(
    document: ChildDocumentDetails,
    documentMetadata: DocumentMetadata,
    archivedProcess: ArchivedProcess?,
    filename: String,
    childIdentifier: ExternalIdentifier,
    birthDate: java.time.LocalDate,
): RecordMetadataInstance {
    return RecordMetadataInstance().apply {
        standardMetadata =
            StandardMetadataType().apply {
                metadataMasterVersion =
                    MetadataMasterVersionType().apply {
                        masterName = "yleinen"
                        versionNumber = "1.0"
                    }
                virtualArchiveId = "YLEINEN"
                recordIdentifiers =
                    StandardMetadataType.RecordIdentifiers().apply {
                        recordIdentifier = document.id.toString()
                    }
                documentDescription =
                    createDocumentDescription(
                        document,
                        documentMetadata,
                        archivedProcess,
                        childIdentifier,
                        birthDate,
                    )
                format = createFormat(filename)
                creation = createCreation(documentMetadata)
                policies = createPolicies(documentMetadata)
                caseFile = createCaseFile(documentMetadata, archivedProcess)
            }
    }
}
