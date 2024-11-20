// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import axios, { AxiosError } from 'axios'

import { isAutomatedTest } from 'lib-common/utils/helpers'

export const API_URL = '/api/application'

export const client = axios.create({
  baseURL: API_URL
})
client.defaults.headers.common['x-evaka-csrf'] = '1'

export const setAntiCsrfToken = (value: string | undefined) => {
  for (const method of ['delete', 'patch', 'post', 'put'] as const) {
    client.defaults.headers[method]['x-evaka-csrf'] = value
  }
}

if (isAutomatedTest) {
  client.interceptors.request.use((config) => {
    const mockedTime =
      typeof window !== 'undefined'
        ? window.evaka?.mockedTime?.toISOString()
        : undefined
    if (mockedTime) {
      config.headers.set('EvakaMockedTime', mockedTime)
    }
    return config
  })
}

client.interceptors.response.use(undefined, async (err: AxiosError) => {
  if (err.response && err.response.status == 401) {
    window.location.replace('/')
  }

  return Promise.reject(err)
})
