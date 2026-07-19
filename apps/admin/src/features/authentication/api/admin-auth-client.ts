import { resolveSafeAdminNextPath } from "@/features/authentication/model/admin-auth-navigation"
import { buildApiUrl, type ApiBaseUrl } from "@/shared/config/api-base-url"

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
  const response = await fetch(
    buildApiUrl(apiBaseUrl, "/api/admin/auth/sign-in/email"),
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
  apiBaseUrl: ApiBaseUrl,
  input: {
    readonly currentPassword: string
    readonly newPassword: string
  }
): Promise<void> {
  await requestAdminAuthJson(apiBaseUrl, "/api/admin/auth/change-password", {
    ...input,
    revokeOtherSessions: true,
  })
}

export async function requestAdminSignOut(
  apiBaseUrl: ApiBaseUrl
): Promise<void> {
  const response = await fetch(
    buildApiUrl(apiBaseUrl, "/api/admin/auth/sign-out"),
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
  apiBaseUrl: ApiBaseUrl,
  path: string,
  body: Readonly<Record<string, unknown>>
): Promise<TResponse> {
  const response = await fetch(buildApiUrl(apiBaseUrl, path), {
    body: JSON.stringify(body),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  if (!response.ok) throw new Error("Admin authentication request failed")
  return (await response.json()) as TResponse
}
