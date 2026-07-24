import "server-only"

import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import {
  assertContentAssetPublicBaseUrlAllowed,
  parseContentAssetImageAllowedOrigins,
  assertPublicUrlTransport,
  parseContentAssetPublicBaseUrl,
  shouldUpgradeInsecureRequests,
} from "@workspace/env/public-url"
import { readContentAssetImageSource } from "@workspace/nextjs-config/content-asset-images"
import { z } from "zod"

import type { ApiBaseUrl } from "@/shared/config/api-base-url"

const optionalUrlSchema = z.union([z.url(), z.literal("")]).optional()
const adminServerRuntimeEnvSchema = z
  .object({
    API_BASE_URL: optionalUrlSchema,
    ADMIN_ORIGIN: optionalUrlSchema,
    CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS: z.string().trim().min(1).optional(),
    CONTENT_ASSET_PUBLIC_BASE_URL: optionalUrlSchema,
    CSP_REPORT_ONLY: z.enum(["true", "false"]).optional(),
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
    "production admin web origin is required",
    "admin web origin"
  )
}

export function readAdminCspRuntimeConfig(
  env: AdminServerRuntimeEnv = process.env
): {
  readonly contentAssetImageSource: string | null
  readonly development: boolean
  readonly reportOnly: boolean
  readonly upgradeInsecureRequests: boolean
} {
  const runtimeEnv = adminServerRuntimeEnvSchema.parse(env)
  const adminOrigin = toServerOrigin(
    runtimeEnv.ADMIN_ORIGIN,
    runtimeEnv.NODE_ENV,
    localRuntimeDefaults.adminWebOrigin,
    "production admin web origin is required",
    "admin web origin"
  )
  const contentAssetPublicBaseUrl = parseContentAssetPublicBaseUrl(
    runtimeEnv.CONTENT_ASSET_PUBLIC_BASE_URL,
    {
      description: "content asset public base URL",
      nodeEnvironment: runtimeEnv.NODE_ENV,
    }
  )
  const contentAssetImageAllowedOrigins = parseContentAssetImageAllowedOrigins(
    runtimeEnv.CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS,
    {
      description: "content asset image allowed origins",
      nodeEnvironment: runtimeEnv.NODE_ENV,
    }
  )
  assertContentAssetPublicBaseUrlAllowed(
    contentAssetPublicBaseUrl,
    contentAssetImageAllowedOrigins,
    {
      description: "content asset public base URL",
      nodeEnvironment: runtimeEnv.NODE_ENV,
    }
  )

  return {
    contentAssetImageSource: readContentAssetImageSource(
      contentAssetPublicBaseUrl
    ),
    development: runtimeEnv.NODE_ENV !== "production",
    reportOnly: runtimeEnv.CSP_REPORT_ONLY === "true",
    upgradeInsecureRequests: shouldUpgradeInsecureRequests(adminOrigin),
  }
}

function toServerOrigin(
  rawValue: string | undefined,
  nodeEnvironment: string | undefined,
  fallback: string,
  productionError: string,
  description?: string
): string {
  if (
    nodeEnvironment === "production" &&
    (rawValue === undefined || rawValue.trim() === "")
  ) {
    throw new Error(productionError)
  }

  const candidate =
    rawValue === undefined || rawValue.trim() === "" ? fallback : rawValue

  const url = new URL(candidate)
  if (description !== undefined) {
    assertPublicUrlTransport(url, { description, nodeEnvironment })
  }

  return url.origin
}
