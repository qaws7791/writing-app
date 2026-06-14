export function createAdminLoginPath(nextPath: string): string {
  const safeNextPath =
    nextPath.startsWith("/") &&
    !nextPath.startsWith("//") &&
    !nextPath.startsWith("/login")
      ? nextPath
      : "/"

  return `/login?next=${encodeURIComponent(safeNextPath)}`
}

export function createAdminLogoutPath(): string {
  return "/login"
}
