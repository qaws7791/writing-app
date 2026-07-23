declare const serverApiBaseUrlBrand: unique symbol

export type ServerApiBaseUrl = string & {
  readonly [serverApiBaseUrlBrand]: true
}
