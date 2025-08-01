// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.user

import fi.espoo.evaka.shared.PersonId
import fi.espoo.evaka.shared.auth.EncodedPassword
import fi.espoo.evaka.shared.db.Database
import fi.espoo.evaka.shared.domain.HelsinkiDateTime
import org.jdbi.v3.json.Json

fun Database.Transaction.updateLastStrongLogin(now: HelsinkiDateTime, id: PersonId) =
    createUpdate {
            sql(
                """
INSERT INTO citizen_user (id, last_strong_login)
VALUES (${bind(id)}, ${bind(now)})
ON CONFLICT (id) DO UPDATE SET last_strong_login = excluded.last_strong_login
"""
            )
        }
        .updateExactlyOne()

data class CitizenWeakLoginDetails(
    val id: PersonId,
    val username: String,
    @Json val password: EncodedPassword,
)

fun Database.Read.getCitizenWeakLoginDetails(username: String): CitizenWeakLoginDetails? =
    createQuery {
            sql(
                """
SELECT id, username, password
FROM citizen_user
WHERE username = ${bind(username)}
"""
            )
        }
        .exactlyOneOrNull()

fun Database.Transaction.updateLastWeakLogin(now: HelsinkiDateTime, id: PersonId) =
    createUpdate {
            sql(
                """
UPDATE citizen_user SET last_weak_login = ${bind(now)}
WHERE id = ${bind(id)}
"""
            )
        }
        .updateExactlyOne()

fun Database.Transaction.updatePasswordWithoutTimestamp(id: PersonId, password: EncodedPassword) =
    createUpdate {
            sql(
                """
UPDATE citizen_user
SET password = ${bindJson(password)}
WHERE id = ${bind(id)}
"""
            )
        }
        .updateExactlyOne()

data class UpdateWeakLoginCredentialsResult(
    val usernameChanged: Boolean,
    val passwordChanged: Boolean,
)

fun Database.Transaction.updateWeakLoginCredentials(
    now: HelsinkiDateTime,
    id: PersonId,
    username: String?, // null = don't update
    password: EncodedPassword?, // null = don't update
): UpdateWeakLoginCredentialsResult =
    createUpdate {
            sql(
                """
WITH old AS (
    SELECT username AS old_username, password AS old_password
    FROM citizen_user
    WHERE id = ${bind(id)}
)
UPDATE citizen_user
SET
    username = coalesce(${bind(username)}, username),
    username_updated_at = coalesce(${bind(now.takeIf { username != null })}, username_updated_at),
    password = coalesce(${bindJson(password)}, password),
    password_updated_at = coalesce(${bind(now.takeIf { password != null })}, password_updated_at)
FROM old
WHERE id = ${bind(id)}
RETURNING (old_username IS NOT NULL AND old_username != username) AS username_changed,
          (old_password IS NOT NULL AND old_password != password) AS password_changed
"""
            )
        }
        .executeAndReturnGeneratedKeys()
        .exactlyOne()

fun Database.Transaction.hasWeakCredentials(person: PersonId): Boolean =
    createQuery {
            sql(
                "SELECT EXISTS(SELECT FROM citizen_user WHERE id = ${bind(person)} AND username IS NOT NULL)"
            )
        }
        .exactlyOne()
