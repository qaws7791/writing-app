"use client"

import { getWebEnv } from "@/env"
import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

export function getBrowserWritingAppApi(): WritingAppApi {
  const env = getWebEnv()

  return createHttpWritingAppApi({
    baseUrl: env.browserApiBaseUrl,
  })
}
