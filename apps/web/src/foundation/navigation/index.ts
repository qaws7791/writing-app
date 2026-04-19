"use client"

const INTERNAL_NAVIGATION_BASE_URL = "https://app.local"

type AppRouterLike = {
  replace: (href: string) => void
}

function toAppUrl(path: string): URL {
  return new URL(path, INTERNAL_NAVIGATION_BASE_URL)
}

export function isSafeInternalPath(
  path: string | null | undefined
): path is string {
  if (typeof path !== "string") {
    return false
  }

  const trimmedPath = path.trim()

  if (
    trimmedPath === "" ||
    !trimmedPath.startsWith("/") ||
    trimmedPath.startsWith("//") ||
    trimmedPath.includes("#")
  ) {
    return false
  }

  try {
    const url = toAppUrl(trimmedPath)

    return (
      url.origin === INTERNAL_NAVIGATION_BASE_URL &&
      url.protocol === "https:" &&
      url.pathname.startsWith("/")
    )
  } catch {
    return false
  }
}

export function appendReturnTo(path: string, returnTo: string): string {
  const targetUrl = toAppUrl(path)

  if (isSafeInternalPath(returnTo)) {
    targetUrl.searchParams.set("returnTo", returnTo)
  }

  return `${targetUrl.pathname}${targetUrl.search}`
}

export function navigateBack(
  router: AppRouterLike,
  {
    fallbackPath,
    returnTo,
  }: {
    fallbackPath: string
    returnTo?: string | null
  }
) {
  router.replace(isSafeInternalPath(returnTo) ? returnTo : fallbackPath)
}
