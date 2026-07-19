declare const apiHostAuthorityBrand: unique symbol

export type ApiHostAuthority = string & {
  readonly [apiHostAuthorityBrand]: "ApiHostAuthority"
}

export type ApiHostConfiguration = ReadonlySet<ApiHostAuthority>

export function parseApiHostConfiguration(
  allowedHosts: string | undefined
): ApiHostConfiguration {
  return parseHostList(allowedHosts)
}

export function normalizeApiHostAuthority(value: string): ApiHostAuthority {
  if (
    value.length === 0 ||
    value !== value.trim() ||
    /[\s/?#@*,\\]/u.test(value) ||
    value.endsWith(".")
  ) {
    throw new Error("유효한 Host authority가 아닙니다.")
  }

  let url: URL
  try {
    url = new URL(`http://${value}/`)
  } catch {
    throw new Error("유효한 Host authority가 아닙니다.")
  }

  if (
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.hostname.length === 0 ||
    !isValidHostname(url.hostname) ||
    url.port === "0"
  ) {
    throw new Error("유효한 Host authority가 아닙니다.")
  }

  return url.host.toLowerCase() as ApiHostAuthority
}

function parseHostList(
  value: string | undefined
): ReadonlySet<ApiHostAuthority> {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(
      "API Host 설정 오류: API_ALLOWED_HOSTS는 비어 있을 수 없습니다."
    )
  }

  const authorities = value.split(",").map((entry) => {
    try {
      return normalizeApiHostAuthority(entry)
    } catch {
      throw new Error(
        "API Host 설정 오류: API_ALLOWED_HOSTS에 유효하지 않은 authority가 있습니다."
      )
    }
  })
  const uniqueAuthorities = new Set(authorities)

  if (uniqueAuthorities.size !== authorities.length) {
    throw new Error(
      "API Host 설정 오류: API_ALLOWED_HOSTS에 중복 authority가 있습니다."
    )
  }

  return uniqueAuthorities
}

function isValidHostname(hostname: string): boolean {
  if (hostname.startsWith("[") && hostname.endsWith("]")) return true

  return hostname.split(".").every((label) => {
    return (
      label.length >= 1 &&
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u.test(label)
    )
  })
}
