const redactedValue = "[REDACTED]"
const securityLogRecordMarker = Symbol("security-log-record")

const sensitiveExactKeys = new Set([
  "answer",
  "apikey",
  "authorization",
  "body",
  "cause",
  "cookie",
  "credential",
  "credentials",
  "displayname",
  "email",
  "firstname",
  "fullname",
  "idtoken",
  "ip",
  "lastname",
  "name",
  "password",
  "prompt",
  "providererror",
  "privatekey",
  "query",
  "querystring",
  "rawbody",
  "rawpayload",
  "searchparams",
  "secret",
  "session",
  "sessionid",
  "setcookie",
  "token",
  "ua",
  "useragent",
  "username",
])

const sensitiveKeyParts = [
  "accesstoken",
  "adminname",
  "apikey",
  "answertext",
  "authtoken",
  "authorization",
  "bearertoken",
  "clientip",
  "clientsecret",
  "credential",
  "csrftoken",
  "displayname",
  "email",
  "firstname",
  "fullname",
  "ipaddress",
  "lastname",
  "learnername",
  "password",
  "prompttext",
  "providercause",
  "providerinput",
  "provideroutput",
  "providerpayload",
  "providerrequest",
  "providerresponse",
  "providerraw",
  "queryparameter",
  "rawanswer",
  "rawprompt",
  "rawprovider",
  "rawtoken",
  "refreshtoken",
  "remoteip",
  "requestbody",
  "responsebody",
  "searchparam",
  "sessiontoken",
  "secretdigest",
  "systemprompt",
  "tokendigest",
  "useragent",
  "username",
  "userprompt",
] as const

const urlBearingKeys = new Set([
  "path",
  "route",
  "routetemplate",
  "target",
  "uri",
  "url",
])

export function markSecurityLogRecord<T extends object>(record: T): T {
  return Object.assign({}, record, { [securityLogRecordMarker]: true })
}

export function redactLogRecord(object: object): Record<string, unknown> {
  return redactValue(object, "", isSecurityLogRecord(object), 0) as Record<
    string,
    unknown
  >
}

export function redactLogValue(value: unknown): unknown {
  return redactValue(value, "", false, 0)
}

export function redactUrlQuery(value: string): string {
  const queryStart = value.indexOf("?")
  if (queryStart === -1) return value

  const fragmentStart = value.indexOf("#", queryStart)
  const fragment =
    fragmentStart === -1 ? "" : value.slice(fragmentStart, value.length)

  return `${value.slice(0, queryStart)}?${redactedValue}${fragment}`
}

function redactValue(
  value: unknown,
  key: string,
  allowSecurityNetworkFields: boolean,
  depth: number
): unknown {
  if (
    !isPublicMcpCredentialId(key, depth) &&
    isSensitiveKey(key, allowSecurityNetworkFields && depth === 1)
  ) {
    return redactedValue
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      redactValue(item, key, allowSecurityNetworkFields, depth)
    )
  }
  if (typeof value === "string" && isUrlBearingKey(key)) {
    return redactUrlQuery(value)
  }
  if (typeof value !== "object" || value === null) return value

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      redactValue(entryValue, entryKey, allowSecurityNetworkFields, depth + 1),
    ])
  )
}

function isPublicMcpCredentialId(key: string, depth: number): boolean {
  return depth === 1 && key === "mcpCredentialId"
}

function isSensitiveKey(
  key: string,
  allowSecurityNetworkField: boolean
): boolean {
  const normalized = normalizeKey(key)

  if (
    allowSecurityNetworkField &&
    (normalized === "clientip" || normalized === "useragent")
  ) {
    return false
  }

  return (
    sensitiveExactKeys.has(normalized) ||
    sensitiveKeyParts.some((sensitivePart) =>
      normalized.includes(sensitivePart)
    )
  )
}

function isSecurityLogRecord(object: object): boolean {
  return securityLogRecordMarker in object
}

function isUrlBearingKey(key: string): boolean {
  const normalized = normalizeKey(key)

  return (
    urlBearingKeys.has(normalized) ||
    normalized.endsWith("url") ||
    normalized.endsWith("uri")
  )
}

function normalizeKey(key: string): string {
  return key.replaceAll(/[^a-z0-9]/giu, "").toLowerCase()
}
