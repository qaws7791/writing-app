import { resolveSafeInternalPath } from "@workspace/ui/lib/safe-navigation-path"

const defaultNextPath = "/app"

export function resolveSafeNextPath(
  nextPath: readonly string[] | string | undefined
): string {
  const candidate = Array.isArray(nextPath) ? nextPath[0] : nextPath

  return resolveSafeInternalPath({
    blockedPathnames: ["/login"],
    candidate,
    defaultPath: defaultNextPath,
  })
}

export function createLoginPagePath(nextPath: string): string {
  const safeNextPath = resolveSafeNextPath(nextPath)

  return `/login?next=${encodeURIComponent(safeNextPath)}`
}

export function createVerifiedLoginPagePath(nextPath: string): string {
  const searchParams = new URLSearchParams({
    next: resolveSafeNextPath(nextPath),
    verified: "true",
  })

  return `/login?${searchParams.toString()}`
}
