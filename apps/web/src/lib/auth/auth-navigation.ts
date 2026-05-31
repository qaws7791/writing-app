const defaultAppPath = "/app"

export function getAuthRedirectPath(nextPath: string = defaultAppPath) {
  return `/login?next=${encodeURIComponent(getSafeNextPath(nextPath))}`
}

export function getSafeNextPath(value: string | null | undefined) {
  if (!value || value.startsWith("//")) {
    return defaultAppPath
  }

  if (
    value === "/app" ||
    value.startsWith("/app/") ||
    value.startsWith("/app?")
  ) {
    return value
  }

  return defaultAppPath
}
