// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.serviceneed

import fi.espoo.evaka.PureJdbiTest
import fi.espoo.evaka.insertServiceNeedOptions
import fi.espoo.evaka.placement.PlacementType
import fi.espoo.evaka.shared.db.Database
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class ServiceNeedQueriesTest : PureJdbiTest(resetDbBeforeEach = true) {
    @Test
    fun getServiceNeedOptionPublicInfos() {
        assertThat(db.read { tx -> tx.getServiceNeedOptionPublicInfos(PlacementType.values().toList()) }).isEmpty()
    }

    @Test
    fun getOnlyShownServiceNeedOptionPublicInfos() {
        db.transaction { tx -> tx.insertServiceNeedOptions() }
        db.transaction { tx -> tx.updateShowForCitizen() }
        assertThat(db.read { tx -> tx.getServiceNeedOptionPublicInfos(PlacementType.values().toList()) }).hasSize(10)
    }

    fun Database.Transaction.updateShowForCitizen() {
        createUpdate("UPDATE service_need_option SET show_for_citizen=FALSE WHERE name_fi like '%Kokopäiväinen liittyvä%'").execute()
    }
}
