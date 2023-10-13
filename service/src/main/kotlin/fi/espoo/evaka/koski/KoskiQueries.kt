// SPDX-FileCopyrightText: 2017-2020 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.koski

import fi.espoo.evaka.shared.ChildId
import fi.espoo.evaka.shared.DaycareId
import fi.espoo.evaka.shared.KoskiStudyRightId
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.db.Predicate
import java.time.LocalDate

data class KoskiStudyRightKey(
    val childId: ChildId,
    val unitId: DaycareId,
    val type: OpiskeluoikeudenTyyppiKoodi
)

fun Database.Read.getPendingStudyRights(
    today: LocalDate,
    params: KoskiSearchParams = KoskiSearchParams()
): List<KoskiStudyRightKey> {
    val childPredicate =
        if (params.personIds.isEmpty()) Predicate.alwaysTrue()
        else Predicate<Any> { where("$it.child_id = ANY(${bind(params.personIds)})") }
    val daycarePredicate =
        if (params.daycareIds.isEmpty()) Predicate.alwaysTrue()
        else Predicate<Any> { where("$it.unit_id = ANY(${bind(params.daycareIds)})") }

    return createQuery<Any> {
            sql(
                """
SELECT kasr.child_id, kasr.unit_id, kasr.type
FROM koski_active_study_right(${bind(today)}) kasr
LEFT JOIN koski_study_right ksr
ON (kasr.child_id, kasr.unit_id, kasr.type) = (ksr.child_id, ksr.unit_id, ksr.type)
WHERE (
    kasr.input_data IS DISTINCT FROM ksr.input_data OR
    ${bind(KOSKI_DATA_VERSION)} IS DISTINCT FROM ksr.input_data_version
)
AND ${predicate(childPredicate.forTable("kasr"))}
AND ${predicate(daycarePredicate.forTable("kasr"))}

UNION

SELECT kvsr.child_id, kvsr.unit_id, kvsr.type
FROM koski_voided_study_right(${bind(today)}) kvsr
WHERE kvsr.void_date IS NULL
AND ${predicate(childPredicate.forTable("kvsr"))}
AND ${predicate(daycarePredicate.forTable("kvsr"))}
"""
            )
        }
        .toList<KoskiStudyRightKey>()
}

fun Database.Transaction.beginKoskiUpload(
    sourceSystem: String,
    ophOrganizationOid: String,
    ophMunicipalityCode: String,
    key: KoskiStudyRightKey,
    today: LocalDate
) =
    createQuery<Any> {
            sql(
                """
INSERT INTO koski_study_right (child_id, unit_id, type, void_date, input_data, input_data_version, payload, version)
SELECT
    child_id, unit_id, type,
    CASE WHEN kvsr.child_id IS NOT NULL THEN ${bind(today)} END AS void_date,
    kasr.input_data, ${bind(KOSKI_DATA_VERSION)}, '{}', 0
FROM (
    SELECT ${bind(key.childId)} AS child_id, ${bind(key.unitId)} AS unit_id, ${bind(key.type)} AS type
) params
LEFT JOIN koski_active_study_right(${bind(today)}) kasr
USING (child_id, unit_id, type)
LEFT JOIN koski_voided_study_right(${bind(today)}) kvsr
USING (child_id, unit_id, type)
WHERE kvsr.void_date IS NULL

ON CONFLICT (child_id, unit_id, type)
DO UPDATE SET
    void_date = excluded.void_date,
    input_data = excluded.input_data,
    input_data_version = excluded.input_data_version,
    study_right_oid = CASE WHEN koski_study_right.void_date IS NULL THEN koski_study_right.study_right_oid END
RETURNING id, void_date IS NOT NULL AS voided
"""
            )
        }
        .exactlyOne { columnPair<KoskiStudyRightId, Boolean>("id", "voided") }
        .let { (id, voided) ->
            if (voided) {
                createQuery<Any> {
                        sql(
                            """
            SELECT
                kvsr.*,
                ksr.id AS study_right_id,
                ksr.study_right_oid,
                d.language AS daycare_language,
                d.provider_type AS daycare_provider_type,
                nullif(pr.social_security_number, '') ssn,
                nullif(pr.oph_person_oid, '') person_oid,
                pr.first_name,
                pr.last_name
            FROM koski_study_right ksr
            JOIN koski_voided_study_right(${bind(today)}) kvsr
            ON (kvsr.child_id, kvsr.unit_id, kvsr.type) = (ksr.child_id, ksr.unit_id, ksr.type)
            JOIN daycare d ON ksr.unit_id = d.id
            JOIN person pr ON ksr.child_id = pr.id
            WHERE ksr.id = ${bind(id)}
                    """
                        )
                    }
                    .exactlyOneOrNull<KoskiVoidedDataRaw>()
                    ?.toKoskiData(sourceSystem, ophOrganizationOid)
            } else {
                createQuery<Any> {
                        sql(
                            """
            SELECT
                kasr.child_id,
                kasr.unit_id,
                kasr.type,
                (kasr.input_data).*,
                ksr.id AS study_right_id,
                ksr.study_right_oid,
                d.language AS daycare_language,
                d.provider_type AS daycare_provider_type,
                unit_manager_name AS approver_name,
                nullif(pr.social_security_number, '') ssn,
                nullif(pr.oph_person_oid, '') person_oid,
                pr.first_name,
                pr.last_name,
                holidays
            FROM koski_study_right ksr
            JOIN koski_active_study_right(${bind(today)}) kasr
            ON (kasr.child_id, kasr.unit_id, kasr.type) = (ksr.child_id, ksr.unit_id, ksr.type)
            JOIN daycare d ON ksr.unit_id = d.id
            JOIN person pr ON ksr.child_id = pr.id
            LEFT JOIN LATERAL (
                SELECT array_agg(date ORDER BY date) AS holidays
                FROM holiday h
                WHERE between_start_and_end(range_merge((kasr.input_data).placements), date)
            ) h ON ksr.type = 'PREPARATORY'
            WHERE ksr.id = ${bind(id)}
                    """
                        )
                    }
                    .exactlyOneOrNull<KoskiActiveDataRaw>()
                    ?.toKoskiData(sourceSystem, ophOrganizationOid, ophMunicipalityCode, today)
            }
        }

data class KoskiUploadResponse(
    val id: KoskiStudyRightId,
    val studyRightOid: String,
    val personOid: String,
    val version: Int,
    val payload: String
)

fun Database.Read.isPayloadChanged(key: KoskiStudyRightKey, payload: String): Boolean =
    createQuery<Any> {
            sql(
                """
SELECT ksr.payload != ${bind(payload)}::jsonb
FROM (
    SELECT ${bind(key.childId)} AS child_id, ${bind(key.unitId)} AS unit_id, ${bind(key.type)} AS type
) params
LEFT JOIN koski_study_right ksr
USING (child_id, unit_id, type)
"""
            )
        }
        .exactlyOne<Boolean>()

fun Database.Transaction.finishKoskiUpload(response: KoskiUploadResponse) =
    createUpdate<Any> {
            sql(
                """
UPDATE koski_study_right
SET study_right_oid = ${bind(response.studyRightOid)}, person_oid = ${bind(response.personOid)},
    version = ${bind(response.version)}, payload = ${bind(response.payload)}::jsonb
WHERE id = ${bind(response.id)}
"""
            )
        }
        .execute()
