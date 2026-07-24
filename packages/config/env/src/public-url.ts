type PublicUrlTransportOptions = {
  readonly description: string
  readonly nodeEnvironment: string | undefined
}

type ContentAssetPublicBaseUrlOptions = {
  readonly description: string
  readonly nodeEnvironment: string | undefined
}

type ContentAssetImageAllowedOriginsOptions = {
  readonly description: string
  readonly nodeEnvironment: string | undefined
}

export function parseContentAssetPublicBaseUrl(
  value: string | undefined,
  { description, nodeEnvironment }: ContentAssetPublicBaseUrlOptions
): URL | null {
  if (value === undefined || value.trim() === "") return null

  const normalized = value.trim()
  const url = new URL(normalized)
  if (
    (url.protocol !== "https:" && url.protocol !== "http:") ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== "" ||
    normalized.includes("?") ||
    normalized.includes("#")
  ) {
    throw new Error(`${description} is not a safe public base URL`)
  }
  if (nodeEnvironment === "production" && url.protocol !== "https:") {
    throw new Error(`${description} must use HTTPS in production`)
  }

  url.pathname = url.pathname.replace(/\/+$/u, "") || "/"
  return url
}

export function parseContentAssetImageAllowedOrigins(
  value: string | undefined,
  { description, nodeEnvironment }: ContentAssetImageAllowedOriginsOptions
): readonly URL[] {
  if (value === undefined || value.trim() === "") return []

  const origins = value.split(",").map((candidate) => {
    const normalized = candidate.trim()
    if (normalized === "") {
      throw new Error(`${description} contains an empty origin`)
    }

    const url = new URL(normalized)
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== "" ||
      url.hostname.includes("*") ||
      normalized !== url.origin
    ) {
      throw new Error(`${description} contains a non-canonical origin`)
    }
    if (nodeEnvironment === "production" && url.protocol !== "https:") {
      throw new Error(`${description} must use HTTPS in production`)
    }

    return url
  })
  const uniqueOrigins = new Set(origins.map((origin) => origin.origin))
  if (uniqueOrigins.size !== origins.length) {
    throw new Error(`${description} contains a duplicate origin`)
  }

  return origins
}

export function assertContentAssetPublicBaseUrlAllowed(
  baseUrl: URL | null,
  allowedOrigins: readonly URL[],
  { description, nodeEnvironment }: ContentAssetImageAllowedOriginsOptions
): void {
  if (baseUrl === null) return
  if (
    allowedOrigins.some(
      (allowedOrigin) => allowedOrigin.origin === baseUrl.origin
    )
  ) {
    return
  }
  if (nodeEnvironment !== "production" && allowedOrigins.length === 0) return

  throw new Error(`${description} origin is not in the image allowlist`)
}

export function assertPublicUrlTransport(
  url: URL,
  { description, nodeEnvironment }: PublicUrlTransportOptions
): void {
  if (nodeEnvironment !== "production" || url.protocol === "https:") {
    return
  }

  if (url.protocol === "http:" && isLoopbackHostname(url.hostname)) {
    return
  }

  throw new Error(
    `production ${description} must use HTTPS unless it targets a loopback host`
  )
}

export function shouldUpgradeInsecureRequests(publicOrigin: string): boolean {
  return new URL(publicOrigin).protocol === "https:"
}

function isLoopbackHostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase()

  return (
    normalizedHostname === "localhost" ||
    normalizedHostname.endsWith(".localhost") ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === "[::1]" ||
    normalizedHostname === "::1"
  )
}
