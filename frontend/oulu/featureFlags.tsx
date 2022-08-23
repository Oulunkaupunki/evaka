{
  /*
SPDX-FileCopyrightText: 2021 City of Oulu

SPDX-License-Identifier: LGPL-2.1-or-later
*/
}

import { FeatureFlags } from 'lib-customizations/types'

const featureFlags: FeatureFlags = {
  citizenShiftCareAbsenceEnabled: false,
  daycareApplication: {
    dailyTimesEnabled: true
  },
  groupsTableServiceNeedsEnabled: true,
  evakaLogin: true,
  financeBasicsPage: true,
  urgencyAttachmentsEnabled: true,
  preschoolEnabled: true,
  assistanceActionOtherEnabled: false,
  experimental: {
    messageAttachments: true,
    personalDetailsPage: true,
    mobileMessages: true,
    voucherUnitPayments: true
  },
  adminSettingsEnabled: true
}

export default featureFlags