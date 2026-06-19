export const learnerSessionCookieName = "learner_session_token"

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

export function getBrowserLearnerSessionToken(): null | string {
  return null
}

export function normalizeLearnerSessionToken(
  token: null | string | undefined
): null | string {
  if (token === null || token === undefined) {
    return null
  }

  const normalizedToken = decodeURIComponent(token).trim()

  return normalizedToken.length === 0 ? null : normalizedToken
}
