"use client"

import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

export function getBrowserWritingAppApi(): WritingAppApi {
  return createHttpWritingAppApi({
    baseUrl: process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:4000",
  })
}
