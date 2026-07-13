"use server"

import { revalidatePath } from "next/cache"

import { createAdminCoursesApi } from "@/features/courses/admin-courses-api"
import { getServerAdminHttpTransport } from "@/lib/api/get-server-admin-http-transport"
import { getServerAdminSessionToken } from "@/lib/auth/server-admin-session-token"
import type { AdminCourseDetail } from "@/features/courses/admin-courses-api"

export async function createAdminCourseAction() {
  const result = await createServerApi().createCourse()

  if (result.status === "ok") revalidatePath("/courses")
  return result
}

export async function archiveAdminCourseAction(courseId: string) {
  const result = await createServerApi().archiveCourse(courseId)

  if (result.status === "ok") revalidatePath("/courses")
  return result
}

export async function saveAdminCourseEditorAction(document: AdminCourseDetail) {
  const result = await createServerApi().saveCourseEditor(document.id, document)

  if (result.status === "ok") {
    revalidatePath("/courses")
    revalidatePath(`/courses/${document.id}`)
  }
  return result
}

export async function readAdminCourseEditorAction(courseId: string) {
  return createServerApi().getCourseEditor(courseId)
}

function createServerApi() {
  return createAdminCoursesApi(
    getServerAdminHttpTransport({ tokenProvider: getServerAdminSessionToken })
  )
}
