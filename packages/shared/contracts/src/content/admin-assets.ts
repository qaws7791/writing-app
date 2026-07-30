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

export type AdminContentAssetUploadDto = z.infer<
  typeof adminContentAssetUploadDtoSchema
>
export type AdminContentAssetKind = z.infer<typeof adminContentAssetKindSchema>
export type ContentAssetReferenceDto = z.infer<
  typeof contentAssetReferenceDtoSchema
>
