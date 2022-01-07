// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.invoicing.controller

import fi.espoo.evaka.Audit
import fi.espoo.evaka.invoicing.data.deleteFeeAlteration
import fi.espoo.evaka.invoicing.data.getFeeAlteration
import fi.espoo.evaka.invoicing.data.getFeeAlterationsForPerson
import fi.espoo.evaka.invoicing.data.upsertFeeAlteration
import fi.espoo.evaka.invoicing.domain.FeeAlteration
import fi.espoo.evaka.shared.FeeAlterationId
import fi.espoo.evaka.shared.PersonId
import fi.espoo.evaka.shared.async.AsyncJob
import fi.espoo.evaka.shared.async.AsyncJobRunner
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.DateRange
import fi.espoo.evaka.shared.domain.maxEndDate
import fi.espoo.evaka.shared.security.AccessControl
import fi.espoo.evaka.shared.security.Action
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/fee-alterations")
class FeeAlterationController(private val asyncJobRunner: AsyncJobRunner<AsyncJob>, private val accessControl: AccessControl) {
    @GetMapping
    fun getFeeAlterations(db: Database, user: AuthenticatedUser, @RequestParam personId: PersonId): ResponseEntity<Wrapper<List<FeeAlteration>>> {
        Audit.ChildFeeAlterationsRead.log(targetId = personId)
        accessControl.requirePermissionFor(user, Action.Child.READ_FEE_ALTERATIONS, personId)

        val feeAlterations = db.connect { dbc -> dbc.read { it.getFeeAlterationsForPerson(personId) } }
        return ResponseEntity.ok(Wrapper(feeAlterations))
    }

    @PostMapping
    fun createFeeAlteration(db: Database, user: AuthenticatedUser, @RequestBody feeAlteration: FeeAlteration): ResponseEntity<Unit> {
        Audit.ChildFeeAlterationsCreate.log(targetId = feeAlteration.personId)
        accessControl.requirePermissionFor(user, Action.Child.CREATE_FEE_ALTERATION, feeAlteration.personId)
        db.connect { dbc ->
            dbc.transaction { tx ->
                tx.upsertFeeAlteration(feeAlteration.copy(id = FeeAlterationId(UUID.randomUUID()), updatedBy = user.evakaUserId))
                asyncJobRunner.plan(
                    tx,
                    listOf(
                        AsyncJob.GenerateFinanceDecisions.forChild(
                            feeAlteration.personId,
                            DateRange(feeAlteration.validFrom, feeAlteration.validTo)
                        )
                    )
                )
            }
        }

        return ResponseEntity.noContent().build()
    }

    @PutMapping("/{feeAlterationId}")
    fun updateFeeAlteration(db: Database, user: AuthenticatedUser, @PathVariable feeAlterationId: FeeAlterationId, @RequestBody feeAlteration: FeeAlteration): ResponseEntity<Unit> {
        Audit.ChildFeeAlterationsUpdate.log(targetId = feeAlterationId)
        accessControl.requirePermissionFor(user, Action.FeeAlteration.UPDATE, feeAlterationId)
        db.connect { dbc ->
            dbc.transaction { tx ->
                val existing = tx.getFeeAlteration(feeAlterationId)
                tx.upsertFeeAlteration(feeAlteration.copy(id = feeAlterationId, updatedBy = user.evakaUserId))

                val expandedPeriod = existing?.let {
                    DateRange(minOf(it.validFrom, feeAlteration.validFrom), maxEndDate(it.validTo, feeAlteration.validTo))
                } ?: DateRange(feeAlteration.validFrom, feeAlteration.validTo)

                asyncJobRunner.plan(tx, listOf(AsyncJob.GenerateFinanceDecisions.forChild(feeAlteration.personId, expandedPeriod)))
            }
        }

        return ResponseEntity.noContent().build()
    }

    @DeleteMapping("/{feeAlterationId}")
    fun deleteFeeAlteration(db: Database, user: AuthenticatedUser, @PathVariable feeAlterationId: FeeAlterationId): ResponseEntity<Unit> {
        Audit.ChildFeeAlterationsDelete.log(targetId = feeAlterationId)
        accessControl.requirePermissionFor(user, Action.FeeAlteration.DELETE, feeAlterationId)
        db.connect { dbc ->
            dbc.transaction { tx ->
                val existing = tx.getFeeAlteration(feeAlterationId)
                tx.deleteFeeAlteration(feeAlterationId)

                existing?.let {
                    asyncJobRunner.plan(
                        tx,
                        listOf(
                            AsyncJob.GenerateFinanceDecisions.forChild(
                                existing.personId,
                                DateRange(existing.validFrom, existing.validTo)
                            )
                        )
                    )
                }
            }
        }

        return ResponseEntity.noContent().build()
    }
}
