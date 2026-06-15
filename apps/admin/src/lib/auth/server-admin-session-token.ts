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

  if (process.env["NODE_ENV"] === "production") {
    return null
  }

  return normalizeAdminSessionToken(process.env["ADMIN_DEV_SESSION_TOKEN"])
}
