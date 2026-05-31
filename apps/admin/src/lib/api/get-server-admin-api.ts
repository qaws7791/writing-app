import { cookies } from "next/headers"

import { getAdminWebEnv } from "@/env"
import type { AdminApi } from "@/lib/api/admin-api"
import { createHttpAdminApi } from "@/lib/api/http-admin-api"

export async function getServerAdminApi(): Promise<AdminApi> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const headers = new Headers()
  const env = getAdminWebEnv()

  if (cookieHeader.length > 0) {
    headers.set("cookie", cookieHeader)
  }

  return createHttpAdminApi({
    baseUrl: env.adminApiBaseUrl,
    headers,
  })
}
