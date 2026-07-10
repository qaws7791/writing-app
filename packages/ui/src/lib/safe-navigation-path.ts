const internalNavigationOrigin = "https://internal-navigation.invalid"

export function resolveSafeInternalPath({
  blockedPathnames = [],
  candidate,
  defaultPath,
}: {
  readonly blockedPathnames?: readonly string[]
  readonly candidate: string | undefined
  readonly defaultPath: string
}): string {
  if (
    candidate === undefined ||
    candidate.length === 0 ||
    !candidate.startsWith("/") ||
    candidate.includes("\\")
  ) {
    return defaultPath
  }

  try {
    const url = new URL(candidate, internalNavigationOrigin)

    if (
      url.origin !== internalNavigationOrigin ||
      blockedPathnames.some(
        (pathname) =>
          url.pathname === pathname || url.pathname.startsWith(`${pathname}/`)
      )
    ) {
      return defaultPath
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return defaultPath
  }
}
