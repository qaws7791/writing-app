const defaultNextPath = "/app"

export function resolveSafeNextPath(
  nextPath: readonly string[] | string | undefined
): string {
  const candidate = Array.isArray(nextPath) ? nextPath[0] : nextPath

  if (candidate === undefined || candidate.length === 0) {
    return defaultNextPath
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return defaultNextPath
  }

  if (candidate === "/login" || candidate.startsWith("/login?")) {
    return defaultNextPath
  }

  return candidate
}

export function createGoogleLoginPath(nextPath: string): string {
  const callbackPath = resolveSafeNextPath(nextPath)

  return `${getApiBaseUrl()}/api/auth/sign-in/google?callbackURL=${encodeURIComponent(callbackPath)}`
}

export function createLoginPagePath(nextPath: string): string {
  const safeNextPath = resolveSafeNextPath(nextPath)

  return `/login?next=${encodeURIComponent(safeNextPath)}`
}

export function createLogoutPath(callbackPath: string): string {
  const safeCallbackPath = resolveSafeNextPath(callbackPath)

  return `${getApiBaseUrl()}/api/auth/sign-out?callbackURL=${encodeURIComponent(safeCallbackPath)}`
}

function getApiBaseUrl(): string {
  return (process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "").replace(/\/$/, "")
}
