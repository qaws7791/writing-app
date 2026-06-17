export function createAdminLoginPath(nextPath: string): string {
  const safeNextPath = resolveSafeAdminNextPath(nextPath)

  return `/login?next=${encodeURIComponent(safeNextPath)}`
}

export function createAdminLogoutPath(): string {
  return "/login"
}

export function resolveSafeAdminNextPath(nextPath: string): string {
  return nextPath.startsWith("/") &&
    !nextPath.startsWith("//") &&
    !nextPath.startsWith("/login")
    ? nextPath
    : "/"
}
