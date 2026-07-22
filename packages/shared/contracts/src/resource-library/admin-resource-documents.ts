import { z } from "zod"

import {
  adminResourceActorDtoSchema,
  adminResourceAssetIdSchema,
  adminResourceBreadcrumbItemDtoSchema,
  adminResourceDocumentIdSchema,
  adminResourceFolderIdSchema,
  adminResourceImageAltTextSchema,
  adminResourceImageMimeTypeSchema,
  adminResourceMarkdownMaxLength,
  adminResourceNameSchema,
  adminResourceNodeStatusSchema,
  adminResourceVersionSchema,
} from "#contracts/resource-library/shared"
import { adminResourceNodeMutationDtoSchema } from "#contracts/resource-library/admin-resource-tree"

export const adminResourceDocumentDtoSchema = z.object({
  contentMarkdown: z.string().max(adminResourceMarkdownMaxLength),
  createdAt: z.iso.datetime(),
  createdBy: adminResourceActorDtoSchema,
  id: adminResourceDocumentIdSchema,
  name: adminResourceNameSchema,
  parentId: adminResourceFolderIdSchema.nullable(),
  path: z.array(adminResourceBreadcrumbItemDtoSchema),
  status: adminResourceNodeStatusSchema,
  updatedAt: z.iso.datetime(),
  updatedBy: adminResourceActorDtoSchema,
  version: adminResourceVersionSchema,
})

export const adminSaveResourceDocumentRequestSchema = z.object({
  contentMarkdown: z.string().max(adminResourceMarkdownMaxLength),
  name: adminResourceNameSchema,
})

export const adminImportResourceDocumentRequestSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(4)
    .max(255)
    .regex(/^[^\p{Cc}/\\]+\.md$/iu),
  markdown: z.string().max(adminResourceMarkdownMaxLength),
  parentId: adminResourceFolderIdSchema.nullable(),
})

export const adminImportResourceDocumentResultDtoSchema = z.object({
  document: adminResourceDocumentDtoSchema,
  mutation: adminResourceNodeMutationDtoSchema,
})

export const adminResourceImageUploadDtoSchema = z.object({
  altText: adminResourceImageAltTextSchema,
  byteSize: z.number().int().positive(),
  contentType: adminResourceImageMimeTypeSchema,
  id: adminResourceAssetIdSchema,
  url: z.url(),
})

export type AdminImportResourceDocumentRequest = z.infer<
  typeof adminImportResourceDocumentRequestSchema
>
export type AdminImportResourceDocumentResultDto = z.infer<
  typeof adminImportResourceDocumentResultDtoSchema
>
export type AdminResourceDocumentDto = z.infer<
  typeof adminResourceDocumentDtoSchema
>
export type AdminResourceImageUploadDto = z.infer<
  typeof adminResourceImageUploadDtoSchema
>
export type AdminSaveResourceDocumentRequest = z.infer<
  typeof adminSaveResourceDocumentRequestSchema
>
