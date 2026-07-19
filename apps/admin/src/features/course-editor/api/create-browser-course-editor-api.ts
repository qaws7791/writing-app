"use client"

import { createAdminCourseEditorApi } from "@/features/course-editor/api/admin-course-editor-api"
import { createAdminHttpTransport } from "@/shared/http/admin-http-transport"
import type { ApiBaseUrl } from "@/shared/config/api-base-url"

export function createBrowserCourseEditorApi(apiBaseUrl: ApiBaseUrl) {
  return createAdminCourseEditorApi(
    createAdminHttpTransport({
      baseUrl: apiBaseUrl,
      fetch: globalThis.fetch.bind(globalThis),
      tokenProvider: () => null,
    })
  )
}
