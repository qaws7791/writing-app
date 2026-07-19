import { z } from "zod"

import type {
  BrowserApiBaseUrl,
  ServerApiBaseUrl,
} from "@/shared/config/api-base-url"

export type { BrowserApiBaseUrl } from "@/shared/config/api-base-url"

type WebRuntimeEnv = {
  readonly [key: string]: string | undefined
}

const browserRuntimeEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().trim().min(1).optional(),
  NODE_ENV: z.string().optional(),
})

const apiBaseUrlSchema = z
  .url()
  .transform((value) => new URL(value).toString().replace(/\/+$/, ""))

export function readBrowserApiBaseUrl(env?: WebRuntimeEnv): BrowserApiBaseUrl {
  const parsedEnv = browserRuntimeEnvSchema.parse(
    env ?? {
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    }
  )

  return toApiBaseUrl(
    parsedEnv.NEXT_PUBLIC_API_BASE_URL,
    parsedEnv.NODE_ENV
  ) as BrowserApiBaseUrl
}

export function buildApiUrl(
  apiBaseUrl: BrowserApiBaseUrl | ServerApiBaseUrl,
  path: string
): string {
  return new URL(path.replace(/^\/+/, ""), `${apiBaseUrl}/`).toString()
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
      ? createDevelopmentBrowserApiBaseUrl()
      : rawValue
  return apiBaseUrlSchema.parse(candidate)
}

function createDevelopmentBrowserApiBaseUrl(): string {
  const url = new URL(window.location.origin)
  url.port = "4000"
  return url.origin
}
