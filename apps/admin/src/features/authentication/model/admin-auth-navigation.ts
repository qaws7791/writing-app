import { resolveSafeInternalPath } from "@workspace/ui/lib/safe-navigation-path"

export const adminLoginReasons = {
  sessionExpired: "session-expired",
} as const

export type AdminLoginReason =
  (typeof adminLoginReasons)[keyof typeof adminLoginReasons]

export function createAdminLoginPath(
  nextPath: string,
  reason?: AdminLoginReason
): string {
  const query = new URLSearchParams({
    next: resolveSafeAdminNextPath(nextPath),
  })

  if (reason !== undefined) {
    query.set("reason", reason)
  }

  return `/login?${query.toString()}`
}

export function resolveSafeAdminNextPath(nextPath: string): string {
  return resolveSafeInternalPath({
    blockedPathnames: ["/login"],
    candidate: nextPath,
    defaultPath: "/",
  })
}

export function resolveAdminLoginReason(
  candidate: string | undefined
): AdminLoginReason | null {
  return candidate === adminLoginReasons.sessionExpired
    ? adminLoginReasons.sessionExpired
    : null
}
