"use client"

import { createFakeWritingAppApi } from "@/lib/api/fake/create-fake-writing-app-api"
import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

export function getBrowserWritingAppApi(): WritingAppApi {
  if ((process.env["NEXT_PUBLIC_API_MODE"] ?? "fake") === "fake") {
    return createFakeWritingAppApi()
  }

  return createHttpWritingAppApi({
    baseUrl: process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:4000",
  })
}
