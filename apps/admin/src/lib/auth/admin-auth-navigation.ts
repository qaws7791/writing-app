const defaultAdminPath = "/courses"

export function getAdminLoginPath(nextPath: string = defaultAdminPath) {
  return `/login?next=${encodeURIComponent(getSafeAdminNextPath(nextPath))}`
}

export function getSafeAdminNextPath(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return defaultAdminPath
  }

  if (isAuthPath(value) || isApiPath(value)) {
    return defaultAdminPath
  }

  return value
}

function isAuthPath(value: string) {
  return (
    value === "/login" ||
    value.startsWith("/login/") ||
    value.startsWith("/login?")
  )
}

function isApiPath(value: string) {
  return (
    value === "/api" || value.startsWith("/api/") || value.startsWith("/api?")
  )
}
