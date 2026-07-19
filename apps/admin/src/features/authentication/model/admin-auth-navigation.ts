import { resolveSafeInternalPath } from "@workspace/ui/lib/safe-navigation-path"

export function createAdminLoginPath(nextPath: string): string {
  const safeNextPath = resolveSafeAdminNextPath(nextPath)

  return `/login?next=${encodeURIComponent(safeNextPath)}`
}

export function createAdminLogoutPath(): string {
  return "/login"
}

export function resolveSafeAdminNextPath(nextPath: string): string {
  return resolveSafeInternalPath({
    blockedPathnames: ["/login"],
    candidate: nextPath,
    defaultPath: "/",
  })
}
