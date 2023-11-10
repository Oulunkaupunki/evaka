// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.invoicing.data

import com.fasterxml.jackson.databind.json.JsonMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.espoo.evaka.invoicing.calculateIncomeTotal
import fi.espoo.evaka.invoicing.calculateMonthlyAmount
import fi.espoo.evaka.invoicing.calculateTotalExpense
import fi.espoo.evaka.invoicing.calculateTotalIncome
import fi.espoo.evaka.invoicing.domain.Income
import fi.espoo.evaka.invoicing.domain.IncomeType
import fi.espoo.evaka.invoicing.domain.IncomeValue
import fi.espoo.evaka.invoicing.service.IncomeCoefficientMultiplierProvider
import fi.espoo.evaka.invoicing.service.IncomeTypesProvider
import fi.espoo.evaka.shared.EvakaUserId
import fi.espoo.evaka.shared.IncomeId
import fi.espoo.evaka.shared.PersonId
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.db.Row
import fi.espoo.evaka.shared.domain.DateRange
import fi.espoo.evaka.shared.domain.EvakaClock
import java.time.LocalDate
import org.postgresql.util.PGobject

fun Database.Transaction.upsertIncome(
    clock: EvakaClock,
    mapper: JsonMapper,
    income: Income,
    updatedBy: EvakaUserId
) {
    val sql =
        """
        INSERT INTO income (
            id,
            person_id,
            effect,
            data,
            is_entrepreneur,
            works_at_echa,
            valid_from,
            valid_to,
            notes,
            updated_at,
            updated_by,
            application_id
        ) VALUES (
            :id,
            :person_id,
            :effect::income_effect,
            :data,
            :is_entrepreneur,
            :works_at_echa,
            :valid_from,
            :valid_to,
            :notes,
            :now,
            :updated_by,
            :application_id
        ) ON CONFLICT (id) DO UPDATE SET
            effect = :effect::income_effect,
            data = :data,
            is_entrepreneur = :is_entrepreneur,
            works_at_echa = :works_at_echa,
            valid_from = :valid_from,
            valid_to = :valid_to,
            notes = :notes,
            updated_at = :now,
            updated_by = :updated_by,
            application_id = :application_id
    """

    val update =
        createUpdate(sql)
            .bind("now", clock.now())
            .bind("id", income.id)
            .bind("person_id", income.personId)
            .bind("effect", income.effect.toString())
            .bind(
                "data",
                PGobject().apply {
                    type = "jsonb"
                    value = mapper.writeValueAsString(income.data)
                }
            )
            .bind("is_entrepreneur", income.isEntrepreneur)
            .bind("works_at_echa", income.worksAtECHA)
            .bind("valid_from", income.validFrom)
            .bind("valid_to", income.validTo)
            .bind("notes", income.notes)
            .bind("updated_by", updatedBy)
            .bind("application_id", income.applicationId)

    handlingExceptions { update.execute() }
}

fun Database.Read.getIncome(
    mapper: JsonMapper,
    incomeTypesProvider: IncomeTypesProvider,
    coefficientMultiplierProvider: IncomeCoefficientMultiplierProvider,
    id: IncomeId
): Income? {
    return createQuery(
            """
        SELECT income.*, evaka_user.name AS updated_by_name,
        (SELECT coalesce(jsonb_agg(json_build_object(
            'id', id,
            'name', name,
            'contentType', content_type
          )), '[]'::jsonb) FROM (
            SELECT a.id, a.name, a.content_type
            FROM attachment a
            WHERE a.income_id = income.id
            ORDER BY a.created
        ) s) AS attachments
        FROM income
        JOIN evaka_user ON income.updated_by = evaka_user.id
        WHERE income.id = :id
        """
                .trimIndent()
        )
        .bind("id", id)
        .exactlyOneOrNull {
            toIncome(mapper, incomeTypesProvider.get(), coefficientMultiplierProvider)
        }
}

fun Database.Read.getIncomesForPerson(
    mapper: JsonMapper,
    incomeTypesProvider: IncomeTypesProvider,
    coefficientMultiplierProvider: IncomeCoefficientMultiplierProvider,
    personId: PersonId,
    validAt: LocalDate? = null
): List<Income> {
    val sql =
        """
        SELECT income.*, evaka_user.name AS updated_by_name,
        (SELECT coalesce(jsonb_agg(json_build_object(
            'id', id,
            'name', name,
            'contentType', content_type
          )), '[]'::jsonb) FROM (
            SELECT a.id, a.name, a.content_type
            FROM attachment a
            WHERE a.income_id = income.id
            ORDER BY a.created
        ) s) AS attachments
        FROM income
        JOIN evaka_user ON income.updated_by = evaka_user.id
        WHERE person_id = :personId
        AND (:validAt::timestamp IS NULL OR tsrange(valid_from, valid_to) @> :validAt::timestamp)
        ORDER BY valid_from DESC
        """
            .trimIndent()

    return createQuery(sql).bind("personId", personId).bind("validAt", validAt).toList {
        toIncome(mapper, incomeTypesProvider.get(), coefficientMultiplierProvider)
    }
}

fun Database.Read.getIncomesFrom(
    mapper: JsonMapper,
    incomeTypesProvider: IncomeTypesProvider,
    coefficientMultiplierProvider: IncomeCoefficientMultiplierProvider,
    personIds: List<PersonId>,
    from: LocalDate
): List<Income> {
    if (personIds.isEmpty()) return emptyList()

    val sql =
        """
        SELECT income.*, evaka_user.name AS updated_by_name, '[]' as attachments
        FROM income
        JOIN evaka_user ON income.updated_by = evaka_user.id
        WHERE
            person_id = ANY(:personIds)
            AND (valid_to IS NULL OR valid_to >= :from)
        """

    return createQuery(sql).bind("personIds", personIds).bind("from", from).toList {
        toIncome(mapper, incomeTypesProvider.get(), coefficientMultiplierProvider)
    }
}

fun Database.Transaction.deleteIncome(incomeId: IncomeId) {
    val update = createUpdate("DELETE FROM income WHERE id = :id").bind("id", incomeId)

    handlingExceptions { update.execute() }
}

fun Database.Transaction.splitEarlierIncome(personId: PersonId, period: DateRange) {
    val sql =
        """
        UPDATE income
        SET valid_to = :newValidTo
        WHERE
            person_id = :personId
            AND valid_from < :from
            AND valid_to IS NULL
        """

    val update =
        createUpdate(sql)
            .bind("personId", personId)
            .bind("newValidTo", period.start.minusDays(1))
            .bind("from", period.start)

    handlingExceptions { update.execute() }
}

fun Row.toIncome(
    mapper: JsonMapper,
    incomeTypes: Map<String, IncomeType>,
    coefficientMultiplierProvider: IncomeCoefficientMultiplierProvider
): Income {
    val data =
        parseIncomeDataJson(column("data"), mapper, incomeTypes, coefficientMultiplierProvider)
    return Income(
        id = column<IncomeId>("id"),
        personId = column("person_id"),
        effect = column("effect"),
        data = data,
        isEntrepreneur = column("is_entrepreneur"),
        worksAtECHA = column("works_at_echa"),
        validFrom = column("valid_from"),
        validTo = column("valid_to"),
        notes = column("notes"),
        updatedAt = column("updated_at"),
        updatedBy = column("updated_by_name"),
        applicationId = column("application_id"),
        attachments = jsonColumn("attachments"),
        totalIncome = calculateTotalIncome(data, coefficientMultiplierProvider),
        totalExpenses = calculateTotalExpense(data, coefficientMultiplierProvider),
        total = calculateIncomeTotal(data, coefficientMultiplierProvider)
    )
}

fun parseIncomeDataJson(
    json: String,
    jsonMapper: JsonMapper,
    incomeTypes: Map<String, IncomeType>,
    coefficientMultiplierProvider: IncomeCoefficientMultiplierProvider
): Map<String, IncomeValue> {
    return jsonMapper.readValue<Map<String, IncomeValue>>(json).mapValues { (type, value) ->
        value.copy(
            multiplier = incomeTypes[type]?.multiplier ?: error("Unknown income type $type"),
            monthlyAmount =
                calculateMonthlyAmount(
                    value.amount,
                    coefficientMultiplierProvider.multiplier(value.coefficient)
                )
        )
    }
}
