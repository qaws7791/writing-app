type PublicUrlTransportOptions = {
  readonly description: string
  readonly nodeEnvironment: string | undefined
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
