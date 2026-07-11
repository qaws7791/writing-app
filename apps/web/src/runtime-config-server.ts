import { localRuntimeDefaults } from "@workspace/env"

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
