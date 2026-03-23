const loopbackHostnames = new Set(["127.0.0.1", "localhost"])

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "")
}

function extractHostname(requestHost: string | null): string | null {
  if (!requestHost) {
    return null
  }

  try {
    return new URL(`http://${requestHost}`).hostname
  } catch {
    return null
  }
}

function alignLoopbackHostname(
  baseUrl: string,
  currentHostname: string | null
): string {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  if (!currentHostname) {
    return normalizedBaseUrl
  }

  const normalizedHostname = currentHostname.toLowerCase()
  if (!loopbackHostnames.has(normalizedHostname)) {
    return normalizedBaseUrl
  }

  const url = new URL(normalizedBaseUrl)
  if (!loopbackHostnames.has(url.hostname)) {
    return normalizedBaseUrl
  }

  if (url.hostname === normalizedHostname) {
    return normalizedBaseUrl
  }

  url.hostname = normalizedHostname
  return normalizeBaseUrl(url.toString())
}

export function resolveBrowserApiBaseUrl(baseUrl: string): string {
  const currentHostname =
    typeof window === "undefined" ? null : window.location.hostname

  return alignLoopbackHostname(baseUrl, currentHostname)
}

export function resolveServerApiBaseUrl(
  baseUrl: string,
  requestHost: string | null
): string {
  return alignLoopbackHostname(baseUrl, extractHostname(requestHost))
}
