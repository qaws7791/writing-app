export type ContentAssetRemotePattern = Readonly<{
  hostname: string
  pathname: string
  port: string
  protocol: "http" | "https"
  search: ""
}>

export function createContentAssetRemotePatterns(
  allowedOrigins: readonly URL[]
): readonly ContentAssetRemotePattern[] {
  return allowedOrigins.map((origin) => ({
    hostname: origin.hostname,
    pathname: "/**",
    port: origin.port,
    protocol: origin.protocol === "https:" ? "https" : "http",
    search: "",
  }))
}

export function readContentAssetImageSource(
  baseUrl: URL | null
): string | null {
  return baseUrl?.origin ?? null
}

export function shouldAllowLocalContentAssetImages(
  allowedOrigins: readonly URL[],
  development: boolean
): boolean {
  if (!development) return false

  return allowedOrigins.some((origin) => {
    const hostname = origin.hostname.toLowerCase()
    return (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname === "::1"
    )
  })
}

export function resolveContentAssetImageAllowedOrigins(
  configuredOrigins: readonly URL[],
  developmentBaseUrl: URL | null,
  development: boolean
): readonly URL[] {
  if (configuredOrigins.length > 0 || !development) return configuredOrigins

  return developmentBaseUrl === null ? [] : [new URL(developmentBaseUrl.origin)]
}
