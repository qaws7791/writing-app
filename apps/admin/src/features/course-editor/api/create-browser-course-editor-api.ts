"use client"

import { createAdminCourseEditorApi } from "@/features/course-editor/api/admin-course-editor-api"
import { createAdminHttpTransport } from "@/shared/http/admin-http-transport"
import type { AdminApiBaseUrl } from "@/shared/config/admin-api-url"

export function createBrowserCourseEditorApi(apiBaseUrl: AdminApiBaseUrl) {
  return createAdminCourseEditorApi(
    createAdminHttpTransport({
      baseUrl: apiBaseUrl,
      fetch: globalThis.fetch.bind(globalThis),
      tokenProvider: () => null,
    })
  )
}
