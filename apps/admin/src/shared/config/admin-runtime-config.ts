import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import { assertPublicUrlTransport } from "@workspace/env/public-url"
import { z } from "zod/mini"

import type { ApiBaseUrl } from "@/shared/config/api-base-url"
export { buildApiUrl } from "@/shared/config/api-base-url"
export type { ApiBaseUrl } from "@/shared/config/api-base-url"

const optionalUrlSchema = z.optional(z.union([z.url(), z.literal("")]))
const adminRuntimeEnvSchema = z.looseObject({
  NEXT_PUBLIC_API_BASE_URL: optionalUrlSchema,
  NEXT_PUBLIC_LEARNER_WEB_ORIGIN: optionalUrlSchema,
  NODE_ENV: z.optional(z.string()),
})

type AdminRuntimeEnv = z.input<typeof adminRuntimeEnvSchema>

export function readApiBaseUrl(env?: AdminRuntimeEnv): ApiBaseUrl {
  const runtimeEnv = adminRuntimeEnvSchema.parse(env ?? process.env)
  return toApiBaseUrl(
    runtimeEnv.NEXT_PUBLIC_API_BASE_URL,
    runtimeEnv.NODE_ENV
  ) as ApiBaseUrl
}

export function readLearnerWebOrigin(env?: AdminRuntimeEnv): string {
  const runtimeEnv = adminRuntimeEnvSchema.parse(env ?? process.env)
  const candidate = runtimeEnv.NEXT_PUBLIC_LEARNER_WEB_ORIGIN
  const nodeEnvironment = runtimeEnv.NODE_ENV

  if (
    nodeEnvironment === "production" &&
    (candidate === undefined || candidate.trim() === "")
  ) {
    throw new Error("production learner web origin is required")
  }

  const url = new URL(
    candidate === undefined || candidate.trim() === ""
      ? localRuntimeDefaults.learnerWebOrigin
      : candidate
  )
  assertPublicUrlTransport(url, {
    description: "learner web origin",
    nodeEnvironment,
  })

  return url.origin
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
      ? localRuntimeDefaults.apiBaseUrl
      : rawValue
  const url = new URL(candidate)
  assertPublicUrlTransport(url, {
    description: "public API base URL",
    nodeEnvironment,
  })

  return url.toString().replace(/\/+$/, "")
}
