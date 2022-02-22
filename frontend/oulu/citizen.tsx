{
  /*
SPDX-FileCopyrightText: 2021 City of Oulu

SPDX-License-Identifier: LGPL-2.1-or-later
*/
}

import { CitizenCustomizations } from 'lib-customizations/types'
import OuluLogo from './city-logo-citizen.svg'
import enCustomizations from './enCustomizations'
import featureFlags from './featureFlags'
import fiCustomizations from './fiCustomizations'
import FooterLogo from './footer-logo-citizen.png'
import mapConfig from './mapConfig'

const customizations: CitizenCustomizations = {
  appConfig: {},
  langs: ['fi', 'en'],
  translations: {
    fi: fiCustomizations,
    sv: {},
    en: enCustomizations
  },
  cityLogo: {
    src: OuluLogo,
    alt: 'Oulu logo'
  },
  footerLogo: {
    src: FooterLogo,
    alt: 'Oulu logo'
  },
  routeLinkRootUrl: 'https://oulu.digitransit.fi/',
  mapConfig,
  featureFlags,
  unitProviderTypes: ['MUNICIPAL', 'PRIVATE']
}

export default customizations
