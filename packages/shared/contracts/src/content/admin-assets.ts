import { z } from "zod"

import {
  contentAssetIdSchema,
  courseIdSchema,
  curriculumVersionIdSchema,
} from "#contracts/content/ids"
import { positiveIntegerSchema } from "#contracts/shared/integer"

export const adminContentAssetMaxBytes = 5 * 1024 * 1024

export const adminContentAssetKindSchema = z.enum([
  "course-cover",
  "reading-illustration",
])

export const adminContentAssetMimeTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
])

export const adminContentAssetAltTextSchema = z.string().trim().min(1).max(500)

export const adminContentAssetUploadDtoSchema = z.strictObject({
  altText: adminContentAssetAltTextSchema,
  byteSize: positiveIntegerSchema.max(adminContentAssetMaxBytes),
  contentType: adminContentAssetMimeTypeSchema,
  courseId: courseIdSchema,
  curriculumVersionId: curriculumVersionIdSchema,
  id: contentAssetIdSchema,
  kind: adminContentAssetKindSchema,
  url: z.url(),
})

export const contentAssetReferenceDtoSchema =
  adminContentAssetUploadDtoSchema.pick({
    altText: true,
    id: true,
    kind: true,
    url: true,
  })

/** `orphaned`는 어떤 콘텐츠도 참조하지 않아 정리 작업 대기 중임을 뜻한다. */
export const adminContentAssetStatusSchema = z.enum(["active", "orphaned"])

export const adminCourseAssetDtoSchema =
  adminContentAssetUploadDtoSchema.extend({
    status: adminContentAssetStatusSchema,
  })

export const adminCourseAssetsDtoSchema = z.strictObject({
  items: z.array(adminCourseAssetDtoSchema),
})

export type AdminContentAssetUploadDto = z.infer<
  typeof adminContentAssetUploadDtoSchema
>
export type AdminContentAssetKind = z.infer<typeof adminContentAssetKindSchema>
export type AdminContentAssetStatus = z.infer<
  typeof adminContentAssetStatusSchema
>
export type ContentAssetReferenceDto = z.infer<
  typeof contentAssetReferenceDtoSchema
>
