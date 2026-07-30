declare const apiBaseUrlBrand: unique symbol

export type ApiBaseUrl = string & {
  readonly [apiBaseUrlBrand]: true
}
