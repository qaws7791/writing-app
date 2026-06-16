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

export function createLoginPagePath(nextPath: string): string {
  const safeNextPath = resolveSafeNextPath(nextPath)

  return `/login?next=${encodeURIComponent(safeNextPath)}`
}
