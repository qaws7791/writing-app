"use client"

import { createAdminCourseEditorApi } from "@/features/course-editor/api/admin-course-editor-api"
import { createAdminHttpTransport } from "@/shared/http/admin-http-transport"

export function createBrowserCourseEditorApi() {
  return createAdminCourseEditorApi(
    createAdminHttpTransport({
      fetch: globalThis.fetch.bind(globalThis),
      tokenProvider: () => null,
    })
  )
}
