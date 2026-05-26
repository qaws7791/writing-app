import { createFakeWritingAppApi } from "@/lib/api/fake/create-fake-writing-app-api"
import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

export function getServerWritingAppApi(): WritingAppApi {
  if ((process.env["WEB_API_MODE"] ?? "fake") === "fake") {
    return createFakeWritingAppApi()
  }

  return createHttpWritingAppApi({
    baseUrl: process.env["WEB_API_BASE_URL"] ?? "http://localhost:4000",
  })
}
