"use server"

import "server-only"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { courseIdSchema } from "@/entities/course/model/course-id"
import {
  adminCourseEditorSchema,
  type AdminContentAsset,
  type AdminCourseEditorCommandResult,
} from "@/features/course-editor/model/admin-course-editor"
import { getServerAdminRequestOptions } from "@/server/http/admin-api-request-options"
import {
  invalidAdminRequestFailure,
  settleAdminApiRequest,
  type AdminRequestError,
  type AdminRequestResult,
  unauthenticatedAdminRequestFailure,
} from "@/shared/http/admin-api-client"
import {
  getAdminCourseEditor,
  publishAdminCourse,
  saveAdminCourseEditor,
  uploadAdminContentAsset,
} from "@workspace/http-client/admin"
import {
  adminContentAssetAltTextSchema,
  adminContentAssetKindSchema,
} from "@workspace/contracts/content/admin-assets"
import { curriculumVersionIdSchema } from "@workspace/contracts/content/ids"

const contentAssetUploadActionSchema = z.object({
  altText: adminContentAssetAltTextSchema,
  courseId: courseIdSchema,
  curriculumVersionId: curriculumVersionIdSchema,
  file: z.custom<File>((value) => value instanceof File),
  kind: adminContentAssetKindSchema,
})

export async function saveAdminCourseEditorAction(
  input: unknown
): Promise<AdminCourseEditorCommandResult> {
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

  if (result.status === "error") {
    return resolveEditorCommandFailure(document.data.id, result.error)
  }

  revalidateEditorPaths(document.data.id)
  return result
}

export async function publishAdminCourseAction(
  input: unknown
): Promise<AdminCourseEditorCommandResult> {
  const document = adminCourseEditorSchema.safeParse(input)
  if (!document.success) return invalidAdminRequestFailure()

  const requestOptions = await getServerAdminRequestOptions({
    headers: { "If-Match": `"${document.data.editVersion}"` },
  })
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  const result = await settleAdminApiRequest(
    publishAdminCourse(courseIdSchema.parse(document.data.id), requestOptions)
  )

  if (result.status === "error") {
    return resolveEditorCommandFailure(document.data.id, result.error)
  }

  const latest = await loadLatestEditor(document.data.id)
  revalidateEditorPaths(document.data.id)
  return latest
}

export async function uploadAdminContentAssetAction(
  input: unknown
): Promise<AdminRequestResult<AdminContentAsset>> {
  if (!(input instanceof FormData)) return invalidAdminRequestFailure()

  const upload = contentAssetUploadActionSchema.safeParse({
    altText: input.get("altText"),
    courseId: input.get("courseId"),
    curriculumVersionId: input.get("curriculumVersionId"),
    file: input.get("file"),
    kind: input.get("kind"),
  })
  if (!upload.success) return invalidAdminRequestFailure()

  const requestOptions = await getServerAdminRequestOptions()
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  return settleAdminApiRequest(
    uploadAdminContentAsset(
      upload.data.courseId,
      {
        altText: upload.data.altText,
        curriculumVersionId: upload.data.curriculumVersionId,
        file: upload.data.file,
        kind: upload.data.kind,
      },
      requestOptions
    )
  )
}

async function resolveEditorCommandFailure(
  courseId: string,
  error: AdminRequestError
): Promise<AdminCourseEditorCommandResult> {
  if (error.code !== "CONTENT_CONFLICT") {
    return { error, status: "error" }
  }

  const latest = await loadLatestEditor(courseId)
  return latest.status === "ok"
    ? { latest: latest.value, status: "conflict" }
    : latest
}

async function loadLatestEditor(
  courseId: string
): Promise<
  AdminRequestResult<Awaited<ReturnType<typeof getAdminCourseEditor>>>
> {
  const requestOptions = await getServerAdminRequestOptions()
  if (requestOptions === null) return unauthenticatedAdminRequestFailure()

  return settleAdminApiRequest(
    getAdminCourseEditor(courseIdSchema.parse(courseId), requestOptions)
  )
}

function revalidateEditorPaths(courseId: string): void {
  revalidatePath("/courses")
  revalidatePath(`/courses/${courseId}`)
}
