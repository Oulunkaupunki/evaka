// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.daycare.service

import fi.espoo.evaka.daycare.createDaycareGroup
import fi.espoo.evaka.daycare.deleteDaycareGroup
import fi.espoo.evaka.daycare.getDaycareGroups
import fi.espoo.evaka.daycare.initCaretakers
import fi.espoo.evaka.daycare.isValidDaycareId
import fi.espoo.evaka.messaging.createDaycareGroupMessageAccount
import fi.espoo.evaka.messaging.deleteDaycareGroupMessageAccount
import fi.espoo.evaka.placement.hasGroupPlacements
import fi.espoo.evaka.shared.DaycareId
import fi.espoo.evaka.shared.GroupId
import fi.espoo.evaka.shared.data.DateMap
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.db.Predicate
import fi.espoo.evaka.shared.db.psqlCause
import fi.espoo.evaka.shared.domain.Conflict
import fi.espoo.evaka.shared.domain.NotFound
import java.math.BigDecimal
import java.time.LocalDate
import org.jdbi.v3.core.statement.UnableToExecuteStatementException
import org.postgresql.util.PSQLState
import org.springframework.stereotype.Service

@Service
class DaycareService {
    fun createGroup(
        tx: Database.Transaction,
        daycareId: DaycareId,
        name: String,
        startDate: LocalDate,
        initialCaretakers: Double,
        aromiCustomerId: String?,
    ): DaycareGroup =
        tx.createDaycareGroup(daycareId, name, startDate, aromiCustomerId).also {
            tx.initCaretakers(it.id, it.startDate, initialCaretakers)
            tx.createDaycareGroupMessageAccount(it.id)
        }

    fun deleteGroup(tx: Database.Transaction, groupId: GroupId) =
        try {
            if (tx.hasGroupPlacements(groupId))
                throw Conflict("Cannot delete group which has children placed in it")

            tx.deleteDaycareGroupMessageAccount(groupId)
            tx.deleteDaycareGroup(groupId)
        } catch (e: UnableToExecuteStatementException) {
            throw e.psqlCause()
                ?.takeIf { it.sqlState == PSQLState.FOREIGN_KEY_VIOLATION.state }
                ?.let {
                    Conflict(
                        "Cannot delete group which is still referred to from other data",
                        cause = e,
                    )
                } ?: e
        }

    fun getDaycareGroups(
        tx: Database.Read,
        daycareId: DaycareId,
        startDate: LocalDate?,
        endDate: LocalDate?,
        groupPredicate: Predicate = Predicate.alwaysTrue(),
    ): List<DaycareGroup> {
        if (!tx.isValidDaycareId(daycareId)) throw NotFound("No daycare found with id $daycareId")

        return tx.getDaycareGroups(daycareId, startDate, endDate, groupPredicate)
    }
}

data class DaycareGroup(
    val id: GroupId,
    val daycareId: DaycareId,
    val name: String,
    val startDate: LocalDate,
    val endDate: LocalDate?,
    val deletable: Boolean,
    val jamixCustomerNumber: Int?,
    val aromiCustomerId: String?,
    val nekkuCustomerNumber: String?,
)

data class Caretakers(val minimum: Double, val maximum: Double) {
    companion object {
        fun fromDailyCounts(caretakers: DateMap<BigDecimal>): Caretakers =
            Caretakers(
                minimum =
                    caretakers.entries().minOfOrNull { (_, count) -> count }?.toDouble() ?: 0.0,
                maximum =
                    caretakers.entries().maxOfOrNull { (_, count) -> count }?.toDouble() ?: 0.0,
            )
    }
}
