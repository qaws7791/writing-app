import "server-only"

import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { createGeneratedRequestOptions } from "@workspace/http-client/generated-fetch"

import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import {
  readAdminWebOrigin,
  readServerApiBaseUrl,
} from "@/server/env/admin-runtime-config"

export async function getServerAdminRequestOptions(
  options: RequestInit = {}
): Promise<RequestInit | null> {
  const sessionToken = await getServerAdminSessionToken()
  if (sessionToken === null) return null

  return createServerAdminRequestOptions(sessionToken, options)
}

export function createServerAdminRequestOptions(
  sessionToken: string,
  options: RequestInit = {}
): RequestInit {
  const headers = Object.fromEntries(new Headers(options.headers).entries())
  headers["origin"] = readAdminWebOrigin()

  return createGeneratedRequestOptions(
    {
      baseUrl: readServerApiBaseUrl(),
      cookie: `${adminSessionCookieName}=${encodeURIComponent(sessionToken)}`,
    },
    {
      ...options,
      headers,
    }
  )
}
