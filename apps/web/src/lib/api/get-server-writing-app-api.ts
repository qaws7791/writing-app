import { cookies } from "next/headers"

import { isServerFakeApiMode } from "@/lib/api/api-mode"
import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

export async function getServerWritingAppApi(): Promise<WritingAppApi> {
  if (isServerFakeApiMode()) {
    const { createFakeWritingAppApi } =
      await import("@/lib/api/fake/create-fake-writing-app-api")

    return createFakeWritingAppApi()
  }

  const cookieHeader = (await cookies()).toString()

  return createHttpWritingAppApi({
    baseUrl: process.env["WEB_API_BASE_URL"] ?? "http://localhost:4000",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  })
}
