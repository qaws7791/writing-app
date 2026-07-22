import { z } from "zod"

import { nonNegativeIntegerSchema as adminNonNegativeIntegerSchema } from "#contracts/shared/integer"
import {
  adminResourceFolderIdSchema,
  adminResourceIdSchema,
  adminResourceMaxNodeCount,
  adminResourceNameSchema,
  adminResourceNodeStatusSchema,
} from "#contracts/resource-library/shared"

const adminResourceTreeNodeBaseDtoSchema = z.object({
  id: adminResourceIdSchema,
  name: adminResourceNameSchema,
  parentId: adminResourceFolderIdSchema.nullable(),
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
  nodes: z.array(adminResourceTreeNodeDtoSchema).max(adminResourceMaxNodeCount),
})

export const adminCreateResourceNodeRequestSchema = z.object({
  parentId: adminResourceFolderIdSchema.nullable(),
})

export const adminRenameResourceFolderRequestSchema = z.object({
  name: adminResourceNameSchema,
})

export const adminMoveResourceNodeRequestSchema = z.object({
  destinationParentId: adminResourceFolderIdSchema.nullable(),
})

export const adminResourceNodeMutationDtoSchema = z.object({
  node: adminResourceTreeNodeDtoSchema,
})

export const adminResourceTrashResultDtoSchema = z.object({
  documentCount: adminNonNegativeIntegerSchema,
  folderCount: adminNonNegativeIntegerSchema,
})

export const adminResourceRestoreResultDtoSchema =
  adminResourceTrashResultDtoSchema.extend({
    node: adminResourceTreeNodeDtoSchema,
  })

export type AdminCreateResourceNodeRequest = z.infer<
  typeof adminCreateResourceNodeRequestSchema
>
export type AdminMoveResourceNodeRequest = z.infer<
  typeof adminMoveResourceNodeRequestSchema
>
export type AdminRenameResourceFolderRequest = z.infer<
  typeof adminRenameResourceFolderRequestSchema
>
export type AdminResourceNodeMutationDto = z.infer<
  typeof adminResourceNodeMutationDtoSchema
>
export type AdminResourceRestoreResultDto = z.infer<
  typeof adminResourceRestoreResultDtoSchema
>
export type AdminResourceTrashResultDto = z.infer<
  typeof adminResourceTrashResultDtoSchema
>
export type AdminResourceTreeDto = z.infer<typeof adminResourceTreeDtoSchema>
export type AdminResourceTreeNodeDto = z.infer<
  typeof adminResourceTreeNodeDtoSchema
>
