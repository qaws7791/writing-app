import { cookies } from "next/headers"

import type { AdminApi } from "@/lib/api/admin-api"
import { createHttpAdminApi } from "@/lib/api/http-admin-api"

const defaultAdminApiBaseUrl = "http://localhost:4001"

export async function getServerAdminApi(): Promise<AdminApi> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const headers = new Headers()

  if (cookieHeader.length > 0) {
    headers.set("cookie", cookieHeader)
  }

  return createHttpAdminApi({
    baseUrl: process.env["ADMIN_API_BASE_URL"] ?? defaultAdminApiBaseUrl,
    headers,
  })
}
