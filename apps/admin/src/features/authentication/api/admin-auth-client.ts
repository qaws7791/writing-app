import { createAdminAuthClient } from "@workspace/auth/admin/client"

import { resolveSafeAdminNextPath } from "@/features/authentication/model/admin-auth-navigation"
import type { ApiBaseUrl } from "@/shared/config/api-base-url"

export async function requestAdminPasswordLogin(
  apiBaseUrl: ApiBaseUrl,
  {
    email,
    nextPath,
    password,
  }: {
    readonly email: string
    readonly nextPath: string
    readonly password: string
  }
): Promise<{ readonly nextPath: string }> {
  const safeNextPath = resolveSafeAdminNextPath(nextPath)
  await getAdminAuthClient(apiBaseUrl).signInWithPassword({
    callbackURL: safeNextPath,
    email,
    password,
  })

  return { nextPath: safeNextPath }
}

export async function requestAdminPasswordChange(
  apiBaseUrl: ApiBaseUrl,
  input: {
    readonly currentPassword: string
    readonly newPassword: string
  }
): Promise<void> {
  await getAdminAuthClient(apiBaseUrl).changePassword(input)
}

export async function requestAdminSignOut(
  apiBaseUrl: ApiBaseUrl
): Promise<void> {
  await getAdminAuthClient(apiBaseUrl).signOut()
}

function getAdminAuthClient(apiBaseUrl: ApiBaseUrl) {
  return createAdminAuthClient({
    baseURL: apiBaseUrl,
    fetch: globalThis.fetch.bind(globalThis),
  })
}
