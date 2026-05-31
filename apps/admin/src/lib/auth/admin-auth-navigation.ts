const defaultAdminPath = "/courses"

export function getAdminLoginPath(nextPath: string = defaultAdminPath) {
  return `/login?next=${encodeURIComponent(getSafeAdminNextPath(nextPath))}`
}

export function getSafeAdminNextPath(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return defaultAdminPath
  }

  if (!isAllowedAdminPath(value)) {
    return defaultAdminPath
  }

  return value
}

function isAllowedAdminPath(value: string) {
  return (
    value === "/" ||
    value === "/courses" ||
    value.startsWith("/courses/") ||
    value.startsWith("/courses?") ||
    value === "/users" ||
    value.startsWith("/users/") ||
    value.startsWith("/users?")
  )
}
