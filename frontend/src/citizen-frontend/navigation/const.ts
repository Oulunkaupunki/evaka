// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

export const logoutUrl = `/api/citizen/auth/logout?RelayState=/`

export const getWeakLoginUri = (
  url = `${window.location.pathname}${window.location.search}${window.location.hash}`
) => `/login/form?next=${encodeURIComponent(url)}`

export const getStrongLoginUri = (
  url = `${window.location.pathname}${window.location.search}${window.location.hash}`
) => `/api/citizen/auth/sfi/login?RelayState=${encodeURIComponent(url)}`

export const headerHeightDesktop = 80
export const headerHeightMobile = 60
export const mobileBottomNavHeight = 60
