"use server"

import "server-only"

import { revalidatePath } from "next/cache"

import { courseIdSchema } from "@/entities/course/model/course-id"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  archiveAdminCourse,
  createAdminCourse,
  restoreAdminCourse,
} from "@workspace/http-client/admin"
import {
  invalidAdminRequestFailure,
  settleAdminApiRequest,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"

export async function createAdminCourseAction() {
  const requestOptions = await getServerAdminRequestOptions()
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  const result = await settleAdminApiRequest(createAdminCourse(requestOptions))

  if (result.status === "ok") revalidatePath("/courses")
  return result
}

export async function archiveAdminCourseAction(input: unknown) {
  const courseId = courseIdSchema.safeParse(input)
  if (!courseId.success) return invalidAdminRequestFailure()

  const requestOptions = await getServerAdminRequestOptions()
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  const result = await settleAdminApiRequest(
    archiveAdminCourse(courseId.data, requestOptions)
  )

  if (result.status === "ok") revalidatePath("/courses")
  return result
}

export async function restoreAdminCourseAction(input: unknown) {
  const courseId = courseIdSchema.safeParse(input)
  if (!courseId.success) return invalidAdminRequestFailure()

  const requestOptions = await getServerAdminRequestOptions()
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  const result = await settleAdminApiRequest(
    restoreAdminCourse(courseId.data, requestOptions)
  )

  if (result.status === "ok") revalidatePath("/courses")
  return result
}
