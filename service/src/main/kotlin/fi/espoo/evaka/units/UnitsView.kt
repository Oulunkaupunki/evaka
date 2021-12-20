// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.units

import fi.espoo.evaka.Audit
import fi.espoo.evaka.ExcludeCodeGen
import fi.espoo.evaka.application.ApplicationStatus
import fi.espoo.evaka.application.ApplicationUnitSummary
import fi.espoo.evaka.application.getApplicationUnitSummaries
import fi.espoo.evaka.backupcare.UnitBackupCare
import fi.espoo.evaka.backupcare.getBackupCaresForDaycare
import fi.espoo.evaka.daycare.getDaycareGroups
import fi.espoo.evaka.daycare.getGroupStats
import fi.espoo.evaka.daycare.getUnitStats
import fi.espoo.evaka.daycare.service.DaycareGroup
import fi.espoo.evaka.daycare.service.Stats
import fi.espoo.evaka.occupancy.OccupancyPeriod
import fi.espoo.evaka.occupancy.OccupancyPeriodGroupLevel
import fi.espoo.evaka.occupancy.OccupancyResponse
import fi.espoo.evaka.occupancy.OccupancyType
import fi.espoo.evaka.occupancy.RealtimeOccupancy
import fi.espoo.evaka.occupancy.calculateOccupancyPeriods
import fi.espoo.evaka.occupancy.calculateOccupancyPeriodsGroupLevel
import fi.espoo.evaka.occupancy.getChildOccupancyAttendances
import fi.espoo.evaka.occupancy.getStaffOccupancyAttendances
import fi.espoo.evaka.placement.DaycarePlacementWithDetails
import fi.espoo.evaka.placement.MissingGroupPlacement
import fi.espoo.evaka.placement.PlacementPlanDetails
import fi.espoo.evaka.placement.TerminatedPlacements
import fi.espoo.evaka.placement.getDetailedDaycarePlacements
import fi.espoo.evaka.placement.getMissingGroupPlacements
import fi.espoo.evaka.placement.getPlacementPlans
import fi.espoo.evaka.placement.getTerminatedPlacements
import fi.espoo.evaka.shared.BackupCareId
import fi.espoo.evaka.shared.DaycareId
import fi.espoo.evaka.shared.GroupId
import fi.espoo.evaka.shared.GroupPlacementId
import fi.espoo.evaka.shared.PlacementId
import fi.espoo.evaka.shared.auth.AuthenticatedUser
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.EvakaClock
import fi.espoo.evaka.shared.domain.FiniteDateRange
import fi.espoo.evaka.shared.security.AccessControl
import fi.espoo.evaka.shared.security.Action
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import java.time.LocalDate

@Controller
@RequestMapping("/views/units")
class UnitsView(private val accessControl: AccessControl) {
    private val terminatedPlacementsViewWeeks = 2L

    @GetMapping("/{unitId}")
    fun getUnitViewData(
        db: Database.DeprecatedConnection,
        user: AuthenticatedUser,
        evakaClock: EvakaClock,
        @PathVariable unitId: DaycareId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate,
        @RequestParam(
            value = "to",
            required = false
        ) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate
    ): ResponseEntity<UnitDataResponse> {
        Audit.UnitView.log(targetId = unitId)
        accessControl.requirePermissionFor(user, Action.Unit.READ_BASIC, unitId)

        val period = FiniteDateRange(from, to)
        val unitData = db.read { tx ->
            val groups = tx.getDaycareGroups(unitId, from, to)
            val placements = tx.getDetailedDaycarePlacements(unitId, null, from, to).toList()
            val backupCares = tx.getBackupCaresForDaycare(unitId, period)
            val missingGroupPlacements = getMissingGroupPlacements(tx, unitId)
            val recentlyTerminatedPlacements = tx.getTerminatedPlacements(evakaClock.today(), unitId, evakaClock.today().minusWeeks(terminatedPlacementsViewWeeks), evakaClock.today())
            val caretakers = Caretakers(
                unitCaretakers = tx.getUnitStats(unitId, from, to),
                groupCaretakers = tx.getGroupStats(unitId, from, to)
            )
            val backupCareIds = backupCares.map { it.id }.toSet() +
                missingGroupPlacements.mapNotNull { if (it.backup) { BackupCareId(it.placementId.raw) } else null }.toSet()
            val placementIds = placements.map { it.id }.toSet() +
                missingGroupPlacements.mapNotNull { if (!it.backup) { it.placementId } else null }.toSet()

            val basicData = UnitDataResponse(
                groups = groups,
                placements = placements,
                backupCares = backupCares,
                missingGroupPlacements = missingGroupPlacements,
                recentlyTerminatedPlacements = recentlyTerminatedPlacements,
                caretakers = caretakers,
                permittedBackupCareActions = accessControl.getPermittedBackupCareActions(user, backupCareIds),
                permittedPlacementActions = accessControl.getPermittedPlacementActions(user, placementIds),
                permittedGroupPlacementActions = accessControl.getPermittedGroupPlacementActions(
                    user,
                    placements.flatMap { placement ->
                        placement.groupPlacements.mapNotNull { groupPlacement -> groupPlacement.id }
                    }
                )
            )

            if (accessControl.hasPermissionFor(user, Action.Unit.READ_DETAILED, unitId)) {
                val unitOccupancies = getUnitOccupancies(tx, unitId, period)
                val groupOccupancies = getGroupOccupancies(tx, unitId, period)
                val placementProposals =
                    tx.getPlacementPlans(unitId, null, null, listOf(ApplicationStatus.WAITING_UNIT_CONFIRMATION, ApplicationStatus.REJECTED))
                val placementPlans = tx.getPlacementPlans(
                    unitId,
                    null,
                    null,
                    listOf(ApplicationStatus.WAITING_CONFIRMATION, ApplicationStatus.WAITING_MAILING)
                )
                val applications = tx.getApplicationUnitSummaries(unitId)

                basicData.copy(
                    unitOccupancies = unitOccupancies,
                    groupOccupancies = groupOccupancies,
                    placementProposals = placementProposals,
                    placementPlans = placementPlans,
                    applications = applications
                )
            } else {
                basicData
            }
        }
        return ResponseEntity.ok(unitData)
    }
}

@ExcludeCodeGen
data class UnitDataResponse(
    val groups: List<DaycareGroup>,
    val placements: List<DaycarePlacementWithDetails>,
    val backupCares: List<UnitBackupCare>,
    val missingGroupPlacements: List<MissingGroupPlacement>,
    val recentlyTerminatedPlacements: List<TerminatedPlacements>,
    val caretakers: Caretakers,
    val unitOccupancies: UnitOccupancies? = null,
    val groupOccupancies: GroupOccupancies? = null,
    val placementProposals: List<PlacementPlanDetails>? = null,
    val placementPlans: List<PlacementPlanDetails>? = null,
    val applications: List<ApplicationUnitSummary>? = null,
    val permittedBackupCareActions: Map<BackupCareId, Set<Action.BackupCare>>,
    val permittedPlacementActions: Map<PlacementId, Set<Action.Placement>>,
    val permittedGroupPlacementActions: Map<GroupPlacementId, Set<Action.GroupPlacement>>,
)

data class Caretakers(
    val unitCaretakers: Stats,
    val groupCaretakers: Map<GroupId, Stats>
)

data class UnitOccupancies(
    val planned: OccupancyResponse,
    val confirmed: OccupancyResponse,
    val realized: OccupancyResponse,
    val realtime: RealtimeOccupancy?
)

private fun getUnitOccupancies(
    tx: Database.Read,
    unitId: DaycareId,
    period: FiniteDateRange
): UnitOccupancies {
    return UnitOccupancies(
        planned = getOccupancyResponse(tx.calculateOccupancyPeriods(unitId, period, OccupancyType.PLANNED)),
        confirmed = getOccupancyResponse(tx.calculateOccupancyPeriods(unitId, period, OccupancyType.CONFIRMED)),
        realized = getOccupancyResponse(tx.calculateOccupancyPeriods(unitId, period, OccupancyType.REALIZED)),
        realtime = period.start.takeIf { it == period.end }?.let { date ->
            RealtimeOccupancy(
                childAttendances = tx.getChildOccupancyAttendances(unitId, date),
                staffAttendances = tx.getStaffOccupancyAttendances(unitId, date)
            )
        }
    )
}

private fun getOccupancyResponse(occupancies: List<OccupancyPeriod>): OccupancyResponse {
    return OccupancyResponse(
        occupancies = occupancies,
        max = occupancies.filter { it.percentage != null }.maxByOrNull { it.percentage!! },
        min = occupancies.filter { it.percentage != null }.minByOrNull { it.percentage!! }
    )
}

data class GroupOccupancies(
    val confirmed: Map<GroupId, OccupancyResponse>,
    val realized: Map<GroupId, OccupancyResponse>
)

private fun getGroupOccupancies(
    tx: Database.Read,
    unitId: DaycareId,
    period: FiniteDateRange
): GroupOccupancies {
    return GroupOccupancies(
        confirmed = getGroupOccupancyResponses(
            tx.calculateOccupancyPeriodsGroupLevel(
                unitId,
                period,
                OccupancyType.CONFIRMED
            )
        ),
        realized = getGroupOccupancyResponses(
            tx.calculateOccupancyPeriodsGroupLevel(
                unitId,
                period,
                OccupancyType.REALIZED
            )
        )
    )
}

private fun getGroupOccupancyResponses(occupancies: List<OccupancyPeriodGroupLevel>): Map<GroupId, OccupancyResponse> {
    return occupancies
        .groupBy { it.groupId }
        .mapValues { (_, value) ->
            val occupancyPeriods = value.map {
                OccupancyPeriod(
                    period = it.period,
                    sum = it.sum,
                    headcount = it.headcount,
                    caretakers = it.caretakers,
                    percentage = it.percentage
                )
            }

            OccupancyResponse(
                occupancies = occupancyPeriods,
                max = occupancyPeriods.filter { it.percentage != null }.maxByOrNull { it.percentage!! },
                min = occupancyPeriods.filter { it.percentage != null }.minByOrNull { it.percentage!! }
            )
        }
}
