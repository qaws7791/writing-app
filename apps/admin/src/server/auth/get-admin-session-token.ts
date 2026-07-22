import "server-only"

import { cookies } from "next/headers"
import { normalizeAdminSessionToken } from "@workspace/auth/session-token"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"

export async function getServerAdminSessionToken(): Promise<null | string> {
  const cookieStore = await cookies()
  const cookieToken = normalizeAdminSessionToken(
    cookieStore.get(adminSessionCookieName)?.value
  )

  if (cookieToken !== null) {
    return cookieToken
  }

  return null
}
