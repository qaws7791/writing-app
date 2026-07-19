declare const browserApiBaseUrlBrand: unique symbol
declare const serverApiBaseUrlBrand: unique symbol

export type BrowserApiBaseUrl = string & {
  readonly [browserApiBaseUrlBrand]: true
}

export type ServerApiBaseUrl = string & {
  readonly [serverApiBaseUrlBrand]: true
}

export type ApiBaseUrl = BrowserApiBaseUrl | ServerApiBaseUrl
