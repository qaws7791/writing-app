import { cookies } from "next/headers"

import { getWebEnv } from "@/env"
import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

export async function getServerWritingAppApi(): Promise<WritingAppApi> {
  const cookieHeader = (await cookies()).toString()
  const env = getWebEnv()

  return createHttpWritingAppApi({
    baseUrl: env.serverApiBaseUrl,
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  })
}
