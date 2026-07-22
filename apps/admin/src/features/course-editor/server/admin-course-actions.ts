"use server"

import "server-only"

import { revalidatePath } from "next/cache"

import { courseIdSchema } from "@/entities/course/model/course-id"
import { createAdminCourseEditorApi } from "@/features/course-editor/api/admin-course-editor-api"
import { adminCourseEditorSchema } from "@/features/course-editor/model/admin-course-editor"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"
import { createAdminActionError } from "@/shared/http/admin-api-result"

export async function saveAdminCourseEditorAction(input: unknown) {
  const document = adminCourseEditorSchema.safeParse(input)
  if (!document.success) return createAdminActionError("invalid-request")

  const token = await getServerAdminSessionToken()
  if (token === null) return createAdminActionError("unauthorized")

  const api = createAdminCourseEditorApi(
    getServerAdminHttpTransport({ tokenProvider: () => token })
  )
  const result = await api.saveCourseEditor(
    courseIdSchema.parse(document.data.id),
    document.data
  )

  if (result.status === "ok") {
    revalidatePath("/courses")
    revalidatePath(`/courses/${document.data.id}`)
  }
  return result
}

export async function publishAdminCourseAction(input: unknown) {
  const document = adminCourseEditorSchema.safeParse(input)
  if (!document.success) return createAdminActionError("invalid-request")

  const token = await getServerAdminSessionToken()
  if (token === null) return createAdminActionError("unauthorized")

  const api = createAdminCourseEditorApi(
    getServerAdminHttpTransport({ tokenProvider: () => token })
  )
  const result = await api.publishCourse(
    courseIdSchema.parse(document.data.id),
    document.data
  )

  if (result.status === "ok") {
    revalidatePath("/courses")
    revalidatePath(`/courses/${document.data.id}`)
  }
  return result
}
