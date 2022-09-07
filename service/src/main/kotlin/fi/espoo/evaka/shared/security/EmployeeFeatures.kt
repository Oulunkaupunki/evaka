// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.shared.security

data class EmployeeFeatures(
    val applications: Boolean,
    val employees: Boolean,
    val financeBasics: Boolean,
    val finance: Boolean,
    val messages: Boolean,
    val personSearch: Boolean,
    val reports: Boolean,
    val settings: Boolean,
    val holidayPeriods: Boolean,
    val unitFeatures: Boolean,
    val units: Boolean,
    val createUnits: Boolean,
    val vasuTemplates: Boolean,
    val personalMobileDevice: Boolean,
    val pinCode: Boolean,
)