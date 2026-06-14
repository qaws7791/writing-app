import { cookies } from "next/headers"

import {
  adminSessionCookieName,
  normalizeAdminSessionToken,
} from "@/lib/auth/admin-session-token"

export async function getServerAdminSessionToken(): Promise<null | string> {
  const cookieStore = await cookies()

  return (
    normalizeAdminSessionToken(
      cookieStore.get(adminSessionCookieName)?.value
    ) ?? normalizeAdminSessionToken(process.env["ADMIN_DEV_SESSION_TOKEN"])
  )
}
