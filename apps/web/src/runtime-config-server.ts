import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

declare const serverApiBaseUrlBrand: unique symbol

export type ServerApiBaseUrl = string & {
  readonly [serverApiBaseUrlBrand]: true
}

type WebServerRuntimeEnv = {
  readonly [key: string]: string | undefined
}

export function readServerApiBaseUrl(
  env: WebServerRuntimeEnv = process.env
): ServerApiBaseUrl {
  return toServerApiBaseUrl(
    env.WEB_API_BASE_URL,
    env.NODE_ENV
  ) as ServerApiBaseUrl
}

export function readTestAuthEnabled(
  env: WebServerRuntimeEnv = process.env
): boolean {
  return env.NODE_ENV !== "production" && env.ENABLE_TEST_AUTH === "true"
}

export function readWebOrigin(env: WebServerRuntimeEnv = process.env): string {
  return toServerOrigin(
    env.WEB_ORIGIN,
    env.NODE_ENV,
    localRuntimeDefaults.learnerWebOrigin,
    "production web origin is required"
  )
}

export function readWebCspRuntimeConfig(
  env: WebServerRuntimeEnv = process.env
): {
  readonly apiOrigin: string
  readonly development: boolean
  readonly reportOnly: boolean
} {
  return {
    apiOrigin: toServerOrigin(
      env.NEXT_PUBLIC_API_BASE_URL,
      env.NODE_ENV,
      localRuntimeDefaults.learnerApiBaseUrl,
      "production public API base URL is required"
    ),
    development: env.NODE_ENV !== "production",
    reportOnly: env.CSP_REPORT_ONLY === "true",
  }
}

function toServerApiBaseUrl(
  rawValue: string | undefined,
  nodeEnvironment: string | undefined
): string {
  if (
    nodeEnvironment === "production" &&
    (rawValue === undefined || rawValue.trim() === "")
  ) {
    throw new Error("production server API base URL is required")
  }

  const candidate =
    rawValue === undefined || rawValue.trim() === ""
      ? localRuntimeDefaults.learnerApiBaseUrl
      : rawValue

  return new URL(candidate).toString().replace(/\/+$/, "")
}

function toServerOrigin(
  rawValue: string | undefined,
  nodeEnvironment: string | undefined,
  fallback: string,
  productionError: string
): string {
  if (
    nodeEnvironment === "production" &&
    (rawValue === undefined || rawValue.trim() === "")
  ) {
    throw new Error(productionError)
  }

  const candidate =
    rawValue === undefined || rawValue.trim() === "" ? fallback : rawValue

  return new URL(candidate).origin
}
