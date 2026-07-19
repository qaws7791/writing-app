import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import { z } from "zod"

import type { ServerApiBaseUrl } from "@/shared/config/api-base-url"

type WebServerRuntimeEnv = {
  readonly [key: string]: string | undefined
}

const webServerRuntimeEnvSchema = z.object({
  CSP_REPORT_ONLY: z.string().optional(),
  ENABLE_TEST_AUTH: z.string().optional(),
  NEXT_PUBLIC_API_BASE_URL: z.string().trim().min(1).optional(),
  NODE_ENV: z.string().optional(),
  WEB_API_BASE_URL: z.string().trim().min(1).optional(),
  WEB_ORIGIN: z.string().trim().min(1).optional(),
})

const urlSchema = z.url()

export function readServerApiBaseUrl(
  env: WebServerRuntimeEnv = process.env
): ServerApiBaseUrl {
  const parsedEnv = webServerRuntimeEnvSchema.parse(env)

  return toServerApiBaseUrl(
    parsedEnv.WEB_API_BASE_URL,
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
  const parsedEnv = webServerRuntimeEnvSchema.parse(env)

  return {
    apiOrigin: toServerOrigin(
      parsedEnv.NEXT_PUBLIC_API_BASE_URL,
      parsedEnv.NODE_ENV,
      localRuntimeDefaults.learnerApiBaseUrl,
      "production public API base URL is required"
    ),
    development: parsedEnv.NODE_ENV !== "production",
    reportOnly: parsedEnv.CSP_REPORT_ONLY === "true",
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

  return urlSchema.parse(candidate).toString().replace(/\/+$/, "")
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

  return new URL(urlSchema.parse(candidate)).origin
}
