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
}): Promise<string> {
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

  return safeNextPath
}
