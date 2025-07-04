// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.daycare.controllers

import fi.espoo.evaka.daycare.CareType
import fi.espoo.evaka.daycare.UnitStub
import fi.espoo.evaka.daycare.domain.Language
import fi.espoo.evaka.daycare.domain.ProviderType
import fi.espoo.evaka.daycare.getApplicationUnits
import fi.espoo.evaka.shared.AreaId
import fi.espoo.evaka.shared.DaycareId
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.db.Predicate
import fi.espoo.evaka.shared.domain.Coordinate
import fi.espoo.evaka.shared.domain.DateRange
import java.time.LocalDate
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class LocationController {
    @GetMapping("/employee/units")
    fun getApplicationUnits(
        db: Database,
        user: AuthenticatedUser.Employee,
        @RequestParam type: ApplicationUnitType,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate,
        @RequestParam shiftCare: Boolean?,
    ): List<PublicUnit> {
        return db.connect { dbc ->
            dbc.read { it.getApplicationUnits(type, date, shiftCare, onlyApplicable = false) }
        }
    }

    @GetMapping("/employee/areas")
    fun getAreas(db: Database, user: AuthenticatedUser.Employee): List<AreaJSON> {
        return db.connect { dbc ->
            dbc.read {
                it.createQuery { sql("SELECT id, name, short_name FROM care_area") }.toList()
            }
        }
    }

    @GetMapping("/employee/filters/units")
    fun getUnits(
        db: Database,
        user: AuthenticatedUser.Employee,
        @RequestParam type: Set<UnitTypeFilter>?,
        @RequestParam areaIds: List<AreaId>?,
        @RequestParam from: LocalDate?,
    ): List<UnitStub> {
        return db.connect { dbc -> dbc.read { it.getUnits(areaIds, type, from) } }
            .sortedBy { it.name.lowercase() }
    }
}

enum class ApplicationUnitType {
    CLUB,
    DAYCARE,
    PRESCHOOL,
    PREPARATORY,
}

data class PublicUnit(
    val id: DaycareId,
    val name: String,
    val type: Set<CareType>,
    val providerType: ProviderType,
    val language: Language,
    val streetAddress: String,
    val postalCode: String,
    val postOffice: String,
    val phone: String?,
    val email: String?,
    val url: String?,
    val location: Coordinate?,
    val ghostUnit: Boolean?,
    val providesShiftCare: Boolean,
    val daycareApplyPeriod: DateRange?,
    val preschoolApplyPeriod: DateRange?,
    val clubApplyPeriod: DateRange?,
)

data class AreaJSON(val id: AreaId, val name: String, val shortName: String)

enum class UnitTypeFilter(val careTypes: Set<CareType>) {
    CLUB(setOf(CareType.CLUB)),
    DAYCARE(setOf(CareType.CENTRE, CareType.FAMILY, CareType.GROUP_FAMILY)),
    PRESCHOOL(setOf(CareType.PRESCHOOL, CareType.PREPARATORY_EDUCATION)),
}

private fun Database.Read.getUnits(
    areaIds: List<AreaId>?,
    types: Set<UnitTypeFilter>?,
    from: LocalDate?,
): List<UnitStub> {
    val areaIdsParam = areaIds?.takeIf { it.isNotEmpty() }
    val careTypes = types?.flatMap { it.careTypes }
    val unitPredicates =
        Predicate.allNotNull(
            careTypes?.let { Predicate { table -> where("$table.type && ${bind(it)}") } },
            from?.let {
                Predicate { table ->
                    where(
                        "daterange($table.opening_date, $table.closing_date, '[]') && daterange(${bind(it)}, NULL)"
                    )
                }
            },
        )
    return createQuery {
            sql(
                """
SELECT unit.id, unit.name, unit.type as care_types
FROM daycare unit
JOIN care_area area ON unit.care_area_id = area.id
WHERE (${bind(areaIdsParam)}::uuid[] IS NULL OR area.id = ANY(${bind(areaIdsParam)}))
AND ${predicate(unitPredicates.forTable("unit"))}
    """
            )
        }
        .toList()
}
