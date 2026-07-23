import "server-only"

import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import {
  assertPublicUrlTransport,
  shouldUpgradeInsecureRequests,
} from "@workspace/env/public-url"
import { z } from "zod"

import type { ServerApiBaseUrl } from "@/shared/config/api-base-url"

type WebServerRuntimeEnv = {
  readonly [key: string]: string | undefined
}

const webServerRuntimeEnvSchema = z.object({
  CSP_REPORT_ONLY: z.string().optional(),
  ENABLE_TEST_AUTH: z.string().optional(),
  NODE_ENV: z.string().optional(),
  API_BASE_URL: z.string().trim().min(1).optional(),
  WEB_ORIGIN: z.string().trim().min(1).optional(),
})

const urlSchema = z.url()

export function readServerApiBaseUrl(
  env: WebServerRuntimeEnv = process.env
): ServerApiBaseUrl {
  const parsedEnv = webServerRuntimeEnvSchema.parse(env)

  return toServerApiBaseUrl(
    parsedEnv.API_BASE_URL,
    parsedEnv.NODE_ENV
  ) as ServerApiBaseUrl
}

export function readTestAuthEnabled(
  env: WebServerRuntimeEnv = process.env
): boolean {
  const parsedEnv = webServerRuntimeEnvSchema.parse(env)

  return (
    parsedEnv.NODE_ENV !== "production" && parsedEnv.ENABLE_TEST_AUTH === "true"
  )
}

export function readWebOrigin(env: WebServerRuntimeEnv = process.env): string {
  const parsedEnv = webServerRuntimeEnvSchema.parse(env)

  return toServerOrigin(
    parsedEnv.WEB_ORIGIN,
    parsedEnv.NODE_ENV,
    localRuntimeDefaults.learnerWebOrigin,
    "production web origin is required",
    "web origin"
  )
}

export function readWebCspRuntimeConfig(
  env: WebServerRuntimeEnv = process.env
): {
  readonly development: boolean
  readonly reportOnly: boolean
  readonly upgradeInsecureRequests: boolean
} {
  const parsedEnv = webServerRuntimeEnvSchema.parse(env)
  const webOrigin = toServerOrigin(
    parsedEnv.WEB_ORIGIN,
    parsedEnv.NODE_ENV,
    localRuntimeDefaults.learnerWebOrigin,
    "production web origin is required",
    "web origin"
  )

  return {
    development: parsedEnv.NODE_ENV !== "production",
    reportOnly: parsedEnv.CSP_REPORT_ONLY === "true",
    upgradeInsecureRequests: shouldUpgradeInsecureRequests(webOrigin),
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
      ? localRuntimeDefaults.apiBaseUrl
      : rawValue

  return urlSchema.parse(candidate).toString().replace(/\/+$/, "")
}

function toServerOrigin(
  rawValue: string | undefined,
  nodeEnvironment: string | undefined,
  fallback: string,
  productionError: string,
  description: string
): string {
  if (
    nodeEnvironment === "production" &&
    (rawValue === undefined || rawValue.trim() === "")
  ) {
    throw new Error(productionError)
  }

  const candidate =
    rawValue === undefined || rawValue.trim() === "" ? fallback : rawValue

  const url = new URL(urlSchema.parse(candidate))
  assertPublicUrlTransport(url, { description, nodeEnvironment })

  return url.origin
}
