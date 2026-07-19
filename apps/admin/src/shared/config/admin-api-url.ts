declare const adminApiBaseUrlBrand: unique symbol

export type AdminApiBaseUrl = string & {
  readonly [adminApiBaseUrlBrand]: true
}

export function buildAdminApiUrl(
  apiBaseUrl: AdminApiBaseUrl,
  path: string
): string {
  return new URL(path.replace(/^\/+/, ""), `${apiBaseUrl}/`).toString()
}
