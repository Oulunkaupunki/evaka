// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import passportSaml, {
  SamlConfig,
  Strategy as SamlStrategy
} from 'passport-saml'
import { employeeLogin } from '../service-client'
import { evakaSamlConfig } from '../config'
import fs from 'fs'
import { RedisClient } from 'redis'
import redisCacheProvider from './passport-saml-cache-redis'
import { toSamlVerifyFunction } from './saml'
import { z } from 'zod'
import { EvakaSessionUser } from './index'

export function createSamlConfig(redisClient?: RedisClient): SamlConfig {
  if (!evakaSamlConfig) throw new Error('Missing Keycloak SAML configuration')
  if (Array.isArray(evakaSamlConfig.publicCert))
    throw new Error('Expected a single string as publicCert')
  const publicCert = fs.readFileSync(evakaSamlConfig.publicCert, {
    encoding: 'utf8'
  })
  const privateCert = fs.readFileSync(evakaSamlConfig.privateCert, {
    encoding: 'utf8'
  })
  return {
    acceptedClockSkewMs: 0,
    audience: evakaSamlConfig.issuer,
    cacheProvider: redisClient
      ? redisCacheProvider(redisClient, { keyPrefix: 'keycloak-saml-resp:' })
      : undefined,
    callbackUrl: evakaSamlConfig.callbackUrl,
    cert: publicCert,
    decryptionPvk: privateCert,
    entryPoint: evakaSamlConfig.entryPoint,
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    issuer: evakaSamlConfig.issuer,
    logoutUrl: evakaSamlConfig.entryPoint,
    privateKey: privateCert,
    signatureAlgorithm: 'sha256',
    validateInResponseTo: evakaSamlConfig.validateInResponseTo
  }
}

const Profile = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string()
})

export default function createKeycloakSamlStrategy(
  config: SamlConfig
): SamlStrategy {
  return new SamlStrategy(
    config,
    toSamlVerifyFunction(Profile, verifyKeycloakProfile)
  )
}

async function verifyKeycloakProfile(
  profile: passportSaml.Profile
): Promise<EvakaSessionUser> {
  const asString = (value: unknown) =>
    value == null ? undefined : String(value)

  const id = asString(profile['id'])
  if (!id) throw Error('No user ID in evaka IDP SAML data')
  const person = await employeeLogin({
    externalId: `evaka:${id}`,
    firstName: asString(profile['firstName']) ?? '',
    lastName: asString(profile['lastName']) ?? '',
    email: asString(profile['email'])
  })
  return {
    id: person.id,
    userType: 'EMPLOYEE',
    globalRoles: person.globalRoles,
    allScopedRoles: person.allScopedRoles
  }
}
