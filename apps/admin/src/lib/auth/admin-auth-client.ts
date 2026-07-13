import { resolveSafeAdminNextPath } from "@/lib/auth/admin-auth-navigation"
import { buildAdminApiUrl, readAdminApiBaseUrl } from "@/runtime-config"

export async function requestAdminPasswordLogin({
  email,
  nextPath,
  password,
}: {
  readonly email: string
  readonly nextPath: string
  readonly password: string
}): Promise<{ readonly nextPath: string }> {
  const safeNextPath = resolveSafeAdminNextPath(nextPath)
  const response = await fetch(
    buildAdminApiUrl(readAdminApiBaseUrl(), "/api/auth/sign-in/email"),
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

export async function requestAdminPasswordChange(input: {
  readonly currentPassword: string
  readonly newPassword: string
}): Promise<void> {
  await requestAdminAuthJson("/api/auth/change-password", {
    ...input,
    revokeOtherSessions: true,
  })
}

export async function requestAdminSignOut(): Promise<void> {
  const response = await fetch(
    buildAdminApiUrl(readAdminApiBaseUrl(), "/api/auth/sign-out"),
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
  path: string,
  body: Readonly<Record<string, unknown>>
): Promise<TResponse> {
  const response = await fetch(buildAdminApiUrl(readAdminApiBaseUrl(), path), {
    body: JSON.stringify(body),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })

  if (!response.ok) throw new Error("Admin authentication request failed")
  return (await response.json()) as TResponse
}
