import { localRuntimeDefaults } from "@workspace/env"

declare const adminApiBaseUrlBrand: unique symbol

export type AdminApiBaseUrl = string & {
  readonly [adminApiBaseUrlBrand]: true
}

type AdminRuntimeEnv = {
  readonly [key: string]: string | undefined
}

export function readAdminApiBaseUrl(
  env: AdminRuntimeEnv = process.env
): AdminApiBaseUrl {
  return toApiBaseUrl(
    env["ADMIN_API_BASE_URL"],
    localRuntimeDefaults.adminApiBaseUrl
  ) as AdminApiBaseUrl
}

export function buildAdminApiUrl(
  apiBaseUrl: AdminApiBaseUrl,
  path: string
): string {
  return new URL(path.replace(/^\/+/, ""), `${apiBaseUrl}/`).toString()
}

function toApiBaseUrl(rawValue: string | undefined, fallback: string): string {
  const candidate =
    rawValue === undefined || rawValue.trim() === "" ? fallback : rawValue
  const url = new URL(candidate)

  return url.toString().replace(/\/+$/, "")
}
