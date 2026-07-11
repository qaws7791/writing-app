import { localRuntimeDefaults } from "@workspace/env"

import type { AdminApiBaseUrl } from "@/runtime-config"

type AdminServerRuntimeEnv = {
  readonly [key: string]: string | undefined
}

export function readServerAdminApiBaseUrl(
  env: AdminServerRuntimeEnv = process.env
): AdminApiBaseUrl {
  return toServerOrigin(
    env.ADMIN_API_BASE_URL,
    env.NODE_ENV,
    localRuntimeDefaults.adminApiBaseUrl,
    "production admin API base URL is required"
  ) as AdminApiBaseUrl
}

export function readAdminWebOrigin(
  env: AdminServerRuntimeEnv = process.env
): string {
  return toServerOrigin(
    env.ADMIN_ORIGIN,
    env.NODE_ENV,
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
  return {
    apiOrigin: toServerOrigin(
      env.NEXT_PUBLIC_ADMIN_API_BASE_URL,
      env.NODE_ENV,
      localRuntimeDefaults.adminApiBaseUrl,
      "production public admin API base URL is required"
    ),
    development: env.NODE_ENV !== "production",
    reportOnly: env.CSP_REPORT_ONLY === "true",
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
