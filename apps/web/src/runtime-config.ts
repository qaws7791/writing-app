import type { ServerApiBaseUrl } from "@/runtime-config-server"

declare const browserApiBaseUrlBrand: unique symbol

export type BrowserApiBaseUrl = string & {
  readonly [browserApiBaseUrlBrand]: true
}

type WebRuntimeEnv = {
  readonly [key: string]: string | undefined
}

export function readBrowserApiBaseUrl(env?: WebRuntimeEnv): BrowserApiBaseUrl {
  return toApiBaseUrl(
    env === undefined
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : env.NEXT_PUBLIC_API_BASE_URL,
    env === undefined ? process.env.NODE_ENV : env.NODE_ENV
  ) as BrowserApiBaseUrl
}

export function buildApiUrl(
  apiBaseUrl: BrowserApiBaseUrl | ServerApiBaseUrl,
  path: string
): string {
  return new URL(path.replace(/^\/+/, ""), `${apiBaseUrl}/`).toString()
}

function toApiBaseUrl(
  rawValue: string | undefined,
  nodeEnvironment: string | undefined
): string {
  if (
    nodeEnvironment === "production" &&
    (rawValue === undefined || rawValue.trim() === "")
  ) {
    throw new Error("production API base URL is required")
  }

  const candidate =
    rawValue === undefined || rawValue.trim() === ""
      ? createDevelopmentBrowserApiBaseUrl()
      : rawValue
  const url = new URL(candidate)

  return url.toString().replace(/\/+$/, "")
}

function createDevelopmentBrowserApiBaseUrl(): string {
  const url = new URL(window.location.origin)
  url.port = "4000"
  return url.origin
}
