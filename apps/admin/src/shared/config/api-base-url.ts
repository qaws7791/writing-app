declare const apiBaseUrlBrand: unique symbol

export type ApiBaseUrl = string & {
  readonly [apiBaseUrlBrand]: true
}

export function buildApiUrl(
  apiBaseUrl: ApiBaseUrl | undefined,
  path: string
): string {
  const normalizedPath = `/${path.replace(/^\/+/u, "")}`
  return apiBaseUrl === undefined
    ? normalizedPath
    : new URL(normalizedPath.slice(1), `${apiBaseUrl}/`).toString()
}
