import { z } from "zod"

import {
  adminResourceActorDtoSchema,
  adminResourceBreadcrumbItemDtoSchema,
  adminResourceDocumentIdSchema,
  adminResourceFolderIdSchema,
  adminResourceMarkdownMaxLength,
  adminResourceNameSchema,
  adminResourceRevisionSchema,
} from "@workspace/contracts/admin/admin-resource-library-shared"
import { adminResourceNodeMutationDtoSchema } from "@workspace/contracts/admin/admin-resource-tree"

const adminResourceDocumentMetadataDtoSchema = z.object({
  contentRevision: adminResourceRevisionSchema,
  createdAt: z.iso.datetime(),
  createdBy: adminResourceActorDtoSchema,
  id: adminResourceDocumentIdSchema,
  name: adminResourceNameSchema,
  parentId: adminResourceFolderIdSchema.nullable(),
  path: z.array(adminResourceBreadcrumbItemDtoSchema),
  stateVersion: adminResourceRevisionSchema,
  updatedAt: z.iso.datetime(),
  updatedBy: adminResourceActorDtoSchema,
})

export const adminResourceActiveDocumentDtoSchema =
  adminResourceDocumentMetadataDtoSchema.extend({
    status: z.literal("active"),
  })

export const adminResourceArchivedDocumentDtoSchema =
  adminResourceDocumentMetadataDtoSchema.extend({
    contentMarkdown: z.string().max(adminResourceMarkdownMaxLength),
    status: z.literal("archived"),
  })

export const adminResourceDocumentDtoSchema = z.discriminatedUnion("status", [
  adminResourceActiveDocumentDtoSchema,
  adminResourceArchivedDocumentDtoSchema,
])

export const adminImportResourceDocumentRequestSchema = z.object({
  expectedRevision: adminResourceRevisionSchema,
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
  document: adminResourceActiveDocumentDtoSchema,
  mutation: adminResourceNodeMutationDtoSchema,
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
