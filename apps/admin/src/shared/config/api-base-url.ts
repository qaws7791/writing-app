declare const apiBaseUrlBrand: unique symbol

export type ApiBaseUrl = string & {
  readonly [apiBaseUrlBrand]: true
}

export function buildApiUrl(apiBaseUrl: ApiBaseUrl, path: string): string {
  return new URL(path.replace(/^\/+/, ""), `${apiBaseUrl}/`).toString()
}
