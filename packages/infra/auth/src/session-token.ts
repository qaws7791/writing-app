import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"

export function readLearnerSessionTokenFromCookieHeader(
  cookieHeader: null | string
): null | string {
  if (cookieHeader === null) {
    return null
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=")

    if (rawName !== learnerSessionCookieName) {
      continue
    }

    return normalizeLearnerSessionToken(rawValueParts.join("="))
  }

  return null
}

export function normalizeLearnerSessionToken(
  token: null | string | undefined
): null | string {
  if (token === null || token === undefined) {
    return null
  }

  let normalizedToken: string
  try {
    normalizedToken = decodeURIComponent(token).trim()
  } catch {
    return null
  }

  return normalizedToken.length === 0 ? null : normalizedToken
}

export function normalizeAdminSessionToken(
  value: string | undefined
): string | null {
  if (value === undefined || value.trim() === "") {
    return null
  }

  return value.trim()
}
