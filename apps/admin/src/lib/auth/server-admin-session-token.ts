import { cookies } from "next/headers"

import {
  adminSessionCookieName,
  normalizeAdminSessionToken,
} from "@/lib/auth/admin-session-token"

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
