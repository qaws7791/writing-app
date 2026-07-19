import { resolveSafeAdminNextPath } from "@/features/authentication/model/admin-auth-navigation"
import {
  buildAdminApiUrl,
  type AdminApiBaseUrl,
} from "@/shared/config/admin-api-url"

export async function requestAdminPasswordLogin(
  apiBaseUrl: AdminApiBaseUrl,
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
  const response = await fetch(
    buildAdminApiUrl(apiBaseUrl, "/api/auth/sign-in/email"),
    {
      body: JSON.stringify({
        callbackURL: safeNextPath,
        email,
        password,
      }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  )

  if (!response.ok) {
    throw new Error("Failed to sign in")
  }

  return { nextPath: safeNextPath }
}

export async function requestAdminPasswordChange(
  apiBaseUrl: AdminApiBaseUrl,
  input: {
    readonly currentPassword: string
    readonly newPassword: string
  }
): Promise<void> {
  await requestAdminAuthJson(apiBaseUrl, "/api/auth/change-password", {
    ...input,
    revokeOtherSessions: true,
  })
}

export async function requestAdminSignOut(
  apiBaseUrl: AdminApiBaseUrl
): Promise<void> {
  const response = await fetch(
    buildAdminApiUrl(apiBaseUrl, "/api/auth/sign-out"),
    {
      credentials: "include",
      method: "POST",
    }
  )

  if (!response.ok) {
    throw new Error("Failed to sign out")
  }
}

async function requestAdminAuthJson<TResponse>(
  apiBaseUrl: AdminApiBaseUrl,
  path: string,
  body: Readonly<Record<string, unknown>>
): Promise<TResponse> {
  const response = await fetch(buildAdminApiUrl(apiBaseUrl, path), {
    body: JSON.stringify(body),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  if (!response.ok) throw new Error("Admin authentication request failed")
  return (await response.json()) as TResponse
}
