import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

declare const adminApiBaseUrlBrand: unique symbol

export type AdminApiBaseUrl = string & {
  readonly [adminApiBaseUrlBrand]: true
}

type AdminRuntimeEnv = {
  readonly [key: string]: string | undefined
}

export function readAdminApiBaseUrl(env?: AdminRuntimeEnv): AdminApiBaseUrl {
  return toApiBaseUrl(
    env === undefined
      ? process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL
      : env.NEXT_PUBLIC_ADMIN_API_BASE_URL,
    env === undefined ? process.env.NODE_ENV : env.NODE_ENV
  ) as AdminApiBaseUrl
}

export function buildAdminApiUrl(
  apiBaseUrl: AdminApiBaseUrl,
  path: string
): string {
  return new URL(path.replace(/^\/+/, ""), `${apiBaseUrl}/`).toString()
}

export function readLearnerWebOrigin(env?: AdminRuntimeEnv): string {
  const candidate =
    env === undefined
      ? process.env.NEXT_PUBLIC_LEARNER_WEB_ORIGIN
      : env.NEXT_PUBLIC_LEARNER_WEB_ORIGIN
  const nodeEnvironment =
    env === undefined ? process.env.NODE_ENV : env.NODE_ENV

  if (
    nodeEnvironment === "production" &&
    (candidate === undefined || candidate.trim() === "")
  ) {
    throw new Error("production learner web origin is required")
  }

  return candidate === undefined || candidate.trim() === ""
    ? localRuntimeDefaults.learnerWebOrigin
    : new URL(candidate).origin
}

function toApiBaseUrl(
  rawValue: string | undefined,
  nodeEnvironment: string | undefined
): string {
  if (
    nodeEnvironment === "production" &&
    (rawValue === undefined || rawValue.trim() === "")
  ) {
    throw new Error("production admin API base URL is required")
  }

  const candidate =
    rawValue === undefined || rawValue.trim() === ""
      ? localRuntimeDefaults.adminApiBaseUrl
      : rawValue
  const url = new URL(candidate)

  return url.toString().replace(/\/+$/, "")
}
