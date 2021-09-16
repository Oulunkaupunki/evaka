// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.invoicing.service

import com.lowagie.text.pdf.BaseFont
import fi.espoo.evaka.decision.DecisionSendAddress
import fi.espoo.evaka.invoicing.domain.FeeAlteration
import fi.espoo.evaka.invoicing.domain.FeeDecisionDetailed
import fi.espoo.evaka.invoicing.domain.FeeDecisionType
import fi.espoo.evaka.invoicing.domain.IncomeEffect
import fi.espoo.evaka.invoicing.domain.VoucherValueDecisionDetailed
import fi.espoo.evaka.placement.PlacementType
import fi.espoo.evaka.shared.message.IMessageProvider
import fi.espoo.evaka.shared.message.MessageLanguage
import fi.espoo.evaka.shared.template.ITemplateProvider
import fi.espoo.voltti.pdfgen.addFontDirectory
import org.springframework.stereotype.Component
import org.thymeleaf.ITemplateEngine
import org.thymeleaf.context.Context
import org.xhtmlrenderer.pdf.ITextRenderer
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.OutputStream
import java.math.BigDecimal
import java.math.RoundingMode
import java.nio.file.Paths
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

class Template(val value: String)
class Page(val template: Template, val context: Context)

data class FeeDecisionPdfData(
    val decision: FeeDecisionDetailed,
    val lang: String
)

data class VoucherValueDecisionPdfData(
    val decision: VoucherValueDecisionDetailed,
    val lang: DocumentLang
)

enum class DocumentLang {
    fi, sv
}

fun BigDecimal.toDecimalString(): String = this.toString().replace('.', ',')

fun formatCents(amountInCents: Int?): String? =
    if (amountInCents != null) BigDecimal(amountInCents).divide(
        BigDecimal(100),
        2,
        RoundingMode.HALF_UP
    ).toDecimalString() else null

fun dateFmt(date: LocalDate?): String = date?.format(DateTimeFormatter.ofPattern("dd.MM.yyyy")) ?: ""

fun instantFmt(instant: Instant?): String =
    instant?.atZone(ZoneId.of("Europe/Helsinki"))?.format(DateTimeFormatter.ofPattern("dd.MM.yyyy")) ?: ""

@Component
class PDFService(
    private val messageProvider: IMessageProvider,
    private val templateProvider: ITemplateProvider,
    private val templateEngine: ITemplateEngine
) {
    fun processPage(page: Page): String = templateEngine.process(page.template.value, page.context)

    fun render(page: Page): ByteArray {
        val os = ByteArrayOutputStream()

        renderHtmlPages(processPage(page), os)
        return os.toByteArray()
    }

    fun renderHtml(page: String): ByteArray {
        val os = ByteArrayOutputStream()
        renderHtmlPages(page, os)
        return os.toByteArray()
    }

    private fun getResourceFile(fileName: String): File {
        val res = javaClass.classLoader.getResource(fileName)
        return Paths.get(res.toURI()).toFile()
    }

    private fun renderHtmlPages(pages: String, os: OutputStream) {
        val textRenderer = ITextRenderer()
        textRenderer.fontResolver.addFontDirectory(getResourceFile("ttf"), BaseFont.IDENTITY_H, true)
        textRenderer.setDocumentFromString(pages)
        textRenderer.layout()
        textRenderer.createPDF(os, false)
        textRenderer.finishPDF()
    }

    fun generateFeeDecisionPdf(data: FeeDecisionPdfData): ByteArray {
        val template = Template(templateProvider.getFeeDecisionPath())
        val page = Page(template, createFeeDecisionPdfContext(data))

        return render(page)
    }

    fun generateVoucherValueDecisionPdf(data: VoucherValueDecisionPdfData): ByteArray {
        val template = Template(templateProvider.getVoucherValueDecisionPath())
        val page = Page(template, createVoucherValueDecisionPdfContext(data))

        return render(page)
    }

    private fun createVoucherValueDecisionPdfContext(data: VoucherValueDecisionPdfData): Context {
        return Context().apply {
            locale = Locale.Builder().setLanguage(data.lang.name).build()
            setVariables(getVoucherValueDecisionPdfVariables(data))
        }
    }

    private fun getVoucherValueDecisionPdfVariables(data: VoucherValueDecisionPdfData): Map<String, Any?> {
        val (decision, lang) = data

        val totalIncome = listOfNotNull(decision.headOfFamilyIncome?.total, decision.partnerIncome?.total).sum()
        val hideTotalIncome =
            (decision.headOfFamilyIncome == null || decision.headOfFamilyIncome.effect != IncomeEffect.INCOME) ||
                (decision.partnerIncome != null && decision.partnerIncome.effect != IncomeEffect.INCOME)

        val sendAddress = DecisionSendAddress.fromPerson(decision.headOfFamily) ?: when (lang.name) {
            "sv" -> messageProvider.getDefaultFeeDecisionAddress(MessageLanguage.SV)
            else -> messageProvider.getDefaultFeeDecisionAddress(MessageLanguage.FI)
        }
        return mapOf(
            "child" to decision.child,
            "approvedAt" to instantFmt(decision.approvedAt),
            "validFrom" to decision.validFrom,
            "validTo" to decision.validTo,
            "placementUnit" to decision.placement.unit,
            "placementType" to decision.placement.type,
            "familySize" to decision.familySize,
            "value" to formatCents(decision.voucherValue),
            "voucherValueDescription" to when (lang) {
                DocumentLang.fi -> decision.serviceNeed.voucherValueDescriptionFi
                DocumentLang.sv -> decision.serviceNeed.voucherValueDescriptionSv
            },
            "headIncomeTotal" to formatCents(decision.headOfFamilyIncome?.total),
            "headIncomeEffect" to (decision.headOfFamilyIncome?.effect?.name ?: IncomeEffect.NOT_AVAILABLE.name),
            "hasPartner" to (decision.partner != null),
            "partner" to decision.partner,
            "partnerFullName" to decision.partner?.let { "${it.firstName} ${it.lastName}" },
            "partnerIncomeEffect" to (decision.partnerIncome?.effect?.name ?: IncomeEffect.NOT_AVAILABLE.name),
            "partnerIncomeTotal" to formatCents(decision.partnerIncome?.total),
            "totalIncome" to formatCents(totalIncome),
            "showTotalIncome" to !hideTotalIncome,
            "coPayment" to formatCents(decision.finalCoPayment),
            "decisionNumber" to decision.decisionNumber,
            "sendAddress" to sendAddress,
            "headFullName" to with(decision.headOfFamily) { "$firstName $lastName" },
            "serviceProviderValue" to formatCents(decision.voucherValue - decision.finalCoPayment),

            "approverFirstName" to (
                decision.financeDecisionHandlerFirstName ?: decision.approvedBy?.firstName
                ),
            "approverLastName" to (
                decision.financeDecisionHandlerLastName ?: decision.approvedBy?.lastName
                ),

        )
    }

    private fun createFeeDecisionPdfContext(
        data: FeeDecisionPdfData

    ): Context {
        return Context().apply {
            locale = Locale.Builder().setLanguage(data.lang).build()
            setVariables(getFeeDecisionPdfVariables(data))
        }
    }

    fun getFeeDecisionPdfVariables(data: FeeDecisionPdfData): Map<String, Any?> {
        data class FeeAlterationPdfPart(
            val type: FeeAlteration.Type,
            val amount: Int,
            val isAbsolute: Boolean,
            val effectFormatted: String
        )
        data class FeeDecisionPdfPart(
            val childName: String,
            val placementType: PlacementType,
            val serviceNeedDescription: String,
            val feeAlterations: List<FeeAlterationPdfPart>,
            val finalFeeFormatted: String,
            val feeFormatted: String
        )

        val (decision, lang) = data

        val totalIncome = listOfNotNull(decision.headOfFamilyIncome?.total, decision.partnerIncome?.total).sum()

        val sendAddress = DecisionSendAddress.fromPerson(decision.headOfFamily) ?: when (lang) {
            "sv" -> messageProvider.getDefaultFeeDecisionAddress(MessageLanguage.SV)
            else -> messageProvider.getDefaultFeeDecisionAddress(MessageLanguage.FI)
        }

        val hideTotalIncome =
            (decision.headOfFamilyIncome == null || decision.headOfFamilyIncome.effect != IncomeEffect.INCOME) ||
                (decision.partnerIncome != null && decision.partnerIncome.effect != IncomeEffect.INCOME)

        val isReliefDecision = decision.decisionType !== FeeDecisionType.NORMAL

        return mapOf(
            "approvedAt" to instantFmt(decision.approvedAt),
            "decisionNumber" to decision.decisionNumber,
            "isReliefDecision" to isReliefDecision,
            "decisionType" to decision.decisionType.toString(),
            "hasPartner" to (decision.partner != null),
            "headFullName" to with(decision.headOfFamily) { "$firstName $lastName" },
            "headIncomeEffect" to (decision.headOfFamilyIncome?.effect?.name ?: IncomeEffect.NOT_AVAILABLE.name),
            "headIncomeTotal" to formatCents(decision.headOfFamilyIncome?.total),
            "partnerFullName" to decision.partner?.let { "${it.firstName} ${it.lastName}" },
            "partnerIncomeEffect" to (decision.partnerIncome?.effect?.name ?: IncomeEffect.NOT_AVAILABLE.name),
            "partnerIncomeTotal" to formatCents(decision.partnerIncome?.total),
            "parts" to decision.children.map {
                FeeDecisionPdfPart(
                    "${it.child.firstName} ${it.child.lastName}",
                    it.placementType,
                    if (lang == "sv") it.serviceNeedDescriptionSv else it.serviceNeedDescriptionFi,
                    it.feeAlterations.map { fa ->
                        FeeAlterationPdfPart(fa.type, fa.amount, fa.isAbsolute, formatCents(fa.effect)!!)
                    },
                    formatCents(it.finalFee)!!,
                    formatCents(it.fee)!!
                )
            },
            "sendAddress" to sendAddress,
            "totalFee" to formatCents(decision.totalFee()),
            "totalIncome" to formatCents(totalIncome),
            "showTotalIncome" to !hideTotalIncome,
            "validFor" to with(decision) { "${dateFmt(validDuring.start)} - ${dateFmt(validDuring.end)}" },
            "validFrom" to dateFmt(decision.validDuring.start),
            "validTo" to dateFmt(decision.validDuring.end),
            "feePercent" to (decision.feeThresholds.incomeMultiplier * BigDecimal(100))
                .setScale(1, RoundingMode.HALF_UP)
                .toDecimalString(),
            "incomeMinThreshold" to formatCents(-1 * decision.feeThresholds.minIncomeThreshold),
            "familySize" to decision.familySize,
            "showValidTo" to (
                (isReliefDecision && decision.validDuring.end != null) ||
                    (decision.validDuring.end?.isBefore(LocalDate.now()) ?: false)
                ),
            "approverFirstName" to (
                decision.financeDecisionHandlerFirstName ?: decision.approvedBy?.firstName
                ),
            "approverLastName" to (
                decision.financeDecisionHandlerLastName ?: decision.approvedBy?.lastName
                ),
        ).mapValues {
            it.value ?: ""
        }
    }
}
