// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka

import org.springframework.core.env.Environment
import java.net.URI
import java.util.Locale

/**
 * A type-safe configuration parsed from environment variables / other property sources supported by Spring Boot by default
 */
data class EvakaEnv(
    val koskiEnabled: Boolean
) {
    companion object {
        fun fromEnvironment(env: Environment): EvakaEnv {
            return EvakaEnv(
                koskiEnabled = env.lookup("evaka.integration.koski.enabled", "fi.espoo.integration.koski.enabled") ?: false
            )
        }
    }
}

data class BucketEnv(
    val s3MockUrl: URI,
    val data: String,
    val attachments: String,
    val decisions: String,
    val feeDecisions: String,
    val voucherValueDecisions: String
) {
    fun allBuckets() = listOf(data, attachments, decisions, feeDecisions, voucherValueDecisions)

    companion object {
        fun fromEnvironment(env: Environment) = BucketEnv(
            s3MockUrl = env.lookup("evaka.s3mock.url", "fi.espoo.voltti.s3mock.url"),
            data = env.lookup("evaka.bucket.data", "fi.espoo.voltti.document.bucket.data"),
            attachments = env.lookup("evaka.bucket.attachments", "fi.espoo.voltti.document.bucket.attachments"),
            decisions = env.lookup("evaka.bucket.decisions", "fi.espoo.voltti.document.bucket.daycaredecision"),
            feeDecisions = env.lookup("evaka.bucket.fee_decisions", "fi.espoo.voltti.document.bucket.paymentdecision"),
            voucherValueDecisions = env.lookup("evaka.bucket.voucher_value_decisions", "fi.espoo.voltti.document.bucket.vouchervaluedecision"),
        )
    }
}

data class KoskiEnv(val url: String, val sourceSystem: String, val user: String, val secret: Sensitive<String>) {
    companion object {
        fun fromEnvironment(env: Environment) = KoskiEnv(
            url = env.lookup("evaka.integration.koski.url", "fi.espoo.integration.koski.url"),
            sourceSystem = env.lookup("evaka.integration.koski.source_system", "fi.espoo.integration.koski.source_system"),
            user = env.lookup("evaka.integration.koski.user", "fi.espoo.integration.koski.user"),
            secret = Sensitive(env.lookup("evaka.integration.koski.secret", "fi.espoo.integration.koski.secret"))
        )
    }
}

data class Sensitive<T>(val value: T) {
    override fun toString(): String = "**REDACTED**"
}

inline fun <reified T> Environment.lookup(key: String, vararg legacyKeys: String): T {
    val value = lookup(key, legacyKeys, T::class.java)
    if (value == null && null !is T) {
        error("Missing required configuration: $key (environment variable ${key.toSystemEnvKey()})")
    } else {
        return value as T
    }
}

fun <T> Environment.lookup(key: String, legacyKeys: Array<out String>, clazz: Class<T>): T? =
    sequenceOf(*legacyKeys, key).mapNotNull { getProperty(it, clazz) }.firstOrNull()

// Reference: Spring SystemEnvironmentPropertySource
fun String.toSystemEnvKey() = uppercase(Locale.ENGLISH)
    .replace('.', '_')
    .replace('-', '_')
