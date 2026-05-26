const defaultAppPath = "/app"

export function getAuthRedirectPath(nextPath: string = defaultAppPath) {
  return `/login?next=${encodeURIComponent(getSafeNextPath(nextPath))}`
}

export function getSafeNextPath(value: string | null | undefined) {
  if (!value?.startsWith("/app")) {
    return defaultAppPath
  }

  if (value.startsWith("//")) {
    return defaultAppPath
  }

  return value
}
