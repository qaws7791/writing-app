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
    containsUnsafeCharacters(candidate)
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

function containsUnsafeCharacters(candidate: string): boolean {
  try {
    const decoded = decodeURIComponent(candidate)
    return (
      decoded.includes("\\") ||
      Array.from(decoded).some((character) => {
        const codePoint = character.codePointAt(0)
        return codePoint !== undefined && (codePoint <= 31 || codePoint === 127)
      })
    )
  } catch {
    return true
  }
}
