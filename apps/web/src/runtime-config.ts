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

export function readBrowserApiBaseUrl(env?: WebRuntimeEnv): BrowserApiBaseUrl {
  return toApiBaseUrl(
    env === undefined
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : env.NEXT_PUBLIC_API_BASE_URL,
    localRuntimeDefaults.learnerApiBaseUrl,
    env === undefined ? process.env.NODE_ENV : env.NODE_ENV
  ) as BrowserApiBaseUrl
}

export function readServerApiBaseUrl(env?: WebRuntimeEnv): ServerApiBaseUrl {
  return toApiBaseUrl(
    env === undefined ? process.env.WEB_API_BASE_URL : env.WEB_API_BASE_URL,
    localRuntimeDefaults.learnerApiBaseUrl,
    env === undefined ? process.env.NODE_ENV : env.NODE_ENV
  ) as ServerApiBaseUrl
}

export function readTestAuthEnabled(env: WebRuntimeEnv = process.env): boolean {
  return env["NODE_ENV"] !== "production" && env["ENABLE_TEST_AUTH"] === "true"
}

export function buildApiUrl(
  apiBaseUrl: BrowserApiBaseUrl | ServerApiBaseUrl,
  path: string
): string {
  return new URL(path.replace(/^\/+/, ""), `${apiBaseUrl}/`).toString()
}

function toApiBaseUrl(
  rawValue: string | undefined,
  fallback: string,
  nodeEnvironment: string | undefined
): string {
  if (
    nodeEnvironment === "production" &&
    (rawValue === undefined || rawValue.trim() === "")
  ) {
    throw new Error("production API base URL is required")
  }

  const candidate =
    rawValue === undefined || rawValue.trim() === "" ? fallback : rawValue
  const url = new URL(candidate)

  return url.toString().replace(/\/+$/, "")
}
