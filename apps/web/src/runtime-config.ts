import { localRuntimeDefaults } from "@workspace/env"

declare const browserApiBaseUrlBrand: unique symbol
declare const serverApiBaseUrlBrand: unique symbol

export type BrowserApiBaseUrl = string & {
  readonly [browserApiBaseUrlBrand]: true
}

export type ServerApiBaseUrl = string & {
  readonly [serverApiBaseUrlBrand]: true
}

type WebRuntimeEnv = {
  readonly [key: string]: string | undefined
}

export function readBrowserApiBaseUrl(
  env: WebRuntimeEnv = process.env
): BrowserApiBaseUrl {
  return toApiBaseUrl(
    env["NEXT_PUBLIC_API_BASE_URL"],
    localRuntimeDefaults.learnerApiBaseUrl
  ) as BrowserApiBaseUrl
}

export function readServerApiBaseUrl(
  env: WebRuntimeEnv = process.env
): ServerApiBaseUrl {
  return toApiBaseUrl(
    env["WEB_API_BASE_URL"],
    localRuntimeDefaults.learnerApiBaseUrl
  ) as ServerApiBaseUrl
}

export function buildApiUrl(
  apiBaseUrl: BrowserApiBaseUrl | ServerApiBaseUrl,
  path: string
): string {
  return new URL(path.replace(/^\/+/, ""), `${apiBaseUrl}/`).toString()
}

function toApiBaseUrl(rawValue: string | undefined, fallback: string): string {
  const candidate =
    rawValue === undefined || rawValue.trim() === "" ? fallback : rawValue
  const url = new URL(candidate)

  return url.toString().replace(/\/+$/, "")
}
