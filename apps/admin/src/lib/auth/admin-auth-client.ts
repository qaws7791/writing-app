import { localRuntimeDefaults } from "@workspace/env"

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
    `${getAdminApiBaseUrl()}/api/auth/sign-in/email`,
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

function getAdminApiBaseUrl(): string {
  return (
    process.env["ADMIN_API_BASE_URL"] ?? localRuntimeDefaults.adminApiBaseUrl
  ).replace(/\/$/, "")
}

function resolveSafeAdminNextPath(nextPath: string): string {
  return nextPath.startsWith("/") &&
    !nextPath.startsWith("//") &&
    !nextPath.startsWith("/login")
    ? nextPath
    : "/"
}
