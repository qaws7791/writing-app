"use server"

import "server-only"

import { revalidatePath } from "next/cache"

import { courseIdSchema } from "@/entities/course/model/course-id"
import { adminCourseEditorSchema } from "@/features/course-editor/model/admin-course-editor"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  invalidAdminRequestFailure,
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import {
  publishAdminCourse,
  saveAdminCourseEditor,
} from "@workspace/http-client/admin"

export async function saveAdminCourseEditorAction(input: unknown) {
  const document = adminCourseEditorSchema.safeParse(input)
  if (!document.success) return invalidAdminRequestFailure()

  const requestOptions = await getServerAdminRequestOptions({
    headers: { "If-Match": `"${document.data.editVersion}"` },
  })
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  const { assets: _assets, ...writeDocument } = document.data
  const result = await settleAdminApiRequest(
    saveAdminCourseEditor(
      courseIdSchema.parse(document.data.id),
      writeDocument,
      requestOptions
    )
  )

  if (result.status === "ok") {
    revalidatePath("/courses")
    revalidatePath(`/courses/${document.data.id}`)
  }
  return result
}

export async function publishAdminCourseAction(input: unknown) {
  const document = adminCourseEditorSchema.safeParse(input)
  if (!document.success) return invalidAdminRequestFailure()

  const requestOptions = await getServerAdminRequestOptions({
    headers: { "If-Match": `"${document.data.editVersion}"` },
  })
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  const result = await settleAdminApiRequest(
    publishAdminCourse(courseIdSchema.parse(document.data.id), requestOptions)
  )

  if (result.status === "ok") {
    revalidatePath("/courses")
    revalidatePath(`/courses/${document.data.id}`)
  }
  return result
}
