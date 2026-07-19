"use server"

import { revalidatePath } from "next/cache"

import { courseIdSchema } from "@/entities/course/model/course-id"
import { createAdminCourseCatalogDal } from "@/features/course-catalog/server/admin-course-catalog-dal"
import { getServerAdminSessionToken } from "@/server/auth/get-admin-session-token"
import { getServerAdminHttpTransport } from "@/server/http/get-admin-http-transport"
import { createAdminActionError } from "@/shared/http/admin-api-result"

export async function createAdminCourseAction() {
  const token = await getServerAdminSessionToken()
  if (token === null) return createAdminActionError("unauthorized")

  const result = await createAdminCourseCatalogDal(
    getServerAdminHttpTransport({ tokenProvider: () => token })
  ).createCourse()

  if (result.status === "ok") revalidatePath("/courses")
  return result
}

export async function archiveAdminCourseAction(input: unknown) {
  const courseId = courseIdSchema.safeParse(input)
  if (!courseId.success) return createAdminActionError("invalid-request")

  const token = await getServerAdminSessionToken()
  if (token === null) return createAdminActionError("unauthorized")

  const result = await createAdminCourseCatalogDal(
    getServerAdminHttpTransport({ tokenProvider: () => token })
  ).archiveCourse(courseId.data)

  if (result.status === "ok") revalidatePath("/courses")
  return result
}
