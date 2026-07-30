import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"

export function learnerSessionCookieHeader(token: string): string {
  return `${learnerSessionCookieName}=${token}`
}

export function readLearnerSessionToken(headers: Headers): string | null {
  const token = headers
    .get("Cookie")
    ?.split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([name]) => name === learnerSessionCookieName)?.[1]

  return token === undefined ? null : decodeURIComponent(token)
}
