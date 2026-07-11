import { z } from "zod"

import { adminNonNegativeIntegerSchema } from "@workspace/contracts/admin/admin-shared"
import {
  adminResourceFolderIdSchema,
  adminResourceIdSchema,
  adminResourceNameSchema,
  adminResourceNodeStatusSchema,
  adminResourceRevisionSchema,
} from "@workspace/contracts/admin/admin-resource-library-shared"

const adminResourceTreeNodeBaseDtoSchema = z.object({
  id: adminResourceIdSchema,
  name: adminResourceNameSchema,
  parentId: adminResourceFolderIdSchema.nullable(),
  sortOrder: adminNonNegativeIntegerSchema,
  status: adminResourceNodeStatusSchema,
})

export const adminResourceFolderTreeNodeDtoSchema =
  adminResourceTreeNodeBaseDtoSchema.extend({
    hasChildren: z.boolean(),
    kind: z.literal("folder"),
  })

export const adminResourceDocumentTreeNodeDtoSchema =
  adminResourceTreeNodeBaseDtoSchema.extend({
    hasChildren: z.literal(false),
    kind: z.literal("document"),
  })

export const adminResourceTreeNodeDtoSchema = z.discriminatedUnion("kind", [
  adminResourceFolderTreeNodeDtoSchema,
  adminResourceDocumentTreeNodeDtoSchema,
])

export const adminResourceTreeDtoSchema = z.object({
  nodes: z.array(adminResourceTreeNodeDtoSchema),
  revision: adminResourceRevisionSchema,
})

export const adminResourceActiveEditorCountDtoSchema = z.object({
  activeEditorCount: adminNonNegativeIntegerSchema,
})

export const adminCreateResourceNodeRequestSchema = z.object({
  expectedRevision: adminResourceRevisionSchema,
  parentId: adminResourceFolderIdSchema.nullable(),
})

export const adminRenameResourceNodeRequestSchema = z.object({
  expectedRevision: adminResourceRevisionSchema,
  name: adminResourceNameSchema,
})

export const adminMoveResourceNodeRequestSchema = z.object({
  destinationIndex: adminNonNegativeIntegerSchema,
  destinationParentId: adminResourceFolderIdSchema.nullable(),
  expectedRevision: adminResourceRevisionSchema,
})

export const adminResourceRevisionRequestSchema = z.object({
  expectedRevision: adminResourceRevisionSchema,
})

const adminResourceMutationBaseDtoSchema = z.object({
  affectedParentIds: z.array(adminResourceFolderIdSchema.nullable()),
  revision: adminResourceRevisionSchema,
})

export const adminResourceNodeMutationDtoSchema =
  adminResourceMutationBaseDtoSchema.extend({
    node: adminResourceTreeNodeDtoSchema,
  })

export const adminResourceTrashMutationDtoSchema =
  adminResourceMutationBaseDtoSchema.extend({
    documentCount: adminNonNegativeIntegerSchema,
    folderCount: adminNonNegativeIntegerSchema,
  })

export const adminResourceTrashResultDtoSchema =
  adminResourceTrashMutationDtoSchema

export const adminResourceRestoreResultDtoSchema =
  adminResourceTrashMutationDtoSchema.extend({
    node: adminResourceTreeNodeDtoSchema,
  })

export type AdminCreateResourceNodeRequest = z.infer<
  typeof adminCreateResourceNodeRequestSchema
>
export type AdminResourceActiveEditorCountDto = z.infer<
  typeof adminResourceActiveEditorCountDtoSchema
>
export type AdminMoveResourceNodeRequest = z.infer<
  typeof adminMoveResourceNodeRequestSchema
>
export type AdminRenameResourceNodeRequest = z.infer<
  typeof adminRenameResourceNodeRequestSchema
>
export type AdminResourceNodeMutationDto = z.infer<
  typeof adminResourceNodeMutationDtoSchema
>
export type AdminResourceRestoreResultDto = z.infer<
  typeof adminResourceRestoreResultDtoSchema
>
export type AdminResourceRevisionRequest = z.infer<
  typeof adminResourceRevisionRequestSchema
>
export type AdminResourceTrashResultDto = z.infer<
  typeof adminResourceTrashResultDtoSchema
>
export type AdminResourceTrashMutationDto = z.infer<
  typeof adminResourceTrashMutationDtoSchema
>
export type AdminResourceTreeDto = z.infer<typeof adminResourceTreeDtoSchema>
export type AdminResourceTreeNodeDto = z.infer<
  typeof adminResourceTreeNodeDtoSchema
>
