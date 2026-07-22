import "server-only"

import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import { z } from "zod"

import type { ApiBaseUrl } from "@/shared/config/api-base-url"

const optionalUrlSchema = z.union([z.url(), z.literal("")]).optional()
const adminServerRuntimeEnvSchema = z
  .object({
    API_BASE_URL: optionalUrlSchema,
    ADMIN_ORIGIN: optionalUrlSchema,
    CSP_REPORT_ONLY: z.enum(["true", "false"]).optional(),
    NEXT_PUBLIC_API_BASE_URL: optionalUrlSchema,
    NODE_ENV: z.string().optional(),
  })
  .loose()

type AdminServerRuntimeEnv = z.input<typeof adminServerRuntimeEnvSchema>

export function readServerApiBaseUrl(
  env: AdminServerRuntimeEnv = process.env
): ApiBaseUrl {
  const runtimeEnv = adminServerRuntimeEnvSchema.parse(env)
  return toServerOrigin(
    runtimeEnv.API_BASE_URL,
    runtimeEnv.NODE_ENV,
    localRuntimeDefaults.apiBaseUrl,
    "production API base URL is required"
  ) as ApiBaseUrl
}

export function readAdminWebOrigin(
  env: AdminServerRuntimeEnv = process.env
): string {
  const runtimeEnv = adminServerRuntimeEnvSchema.parse(env)
  return toServerOrigin(
    runtimeEnv.ADMIN_ORIGIN,
    runtimeEnv.NODE_ENV,
    localRuntimeDefaults.adminWebOrigin,
    "production admin web origin is required"
  )
}

export function readAdminCspRuntimeConfig(
  env: AdminServerRuntimeEnv = process.env
): {
  readonly apiOrigin: string
  readonly development: boolean
  readonly reportOnly: boolean
} {
  const runtimeEnv = adminServerRuntimeEnvSchema.parse(env)
  return {
    apiOrigin: toServerOrigin(
      runtimeEnv.NEXT_PUBLIC_API_BASE_URL,
      runtimeEnv.NODE_ENV,
      localRuntimeDefaults.apiBaseUrl,
      "production public API base URL is required"
    ),
    development: runtimeEnv.NODE_ENV !== "production",
    reportOnly: runtimeEnv.CSP_REPORT_ONLY === "true",
  }
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
