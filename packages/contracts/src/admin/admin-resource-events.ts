import { z } from "zod"

import {
  adminResourceDocumentIdSchema,
  adminResourceFolderIdSchema,
  adminResourceIdSchema,
  adminResourceNameSchema,
  adminResourceRevisionSchema,
} from "@workspace/contracts/admin/admin-resource-library-shared"

export const adminResourceTreeMutationActionSchema = z.enum([
  "create-document",
  "create-folder",
  "import-document",
  "move",
  "rename",
  "restore",
  "trash",
])

export const adminResourceTreeMutationEventSchema = z.object({
  action: adminResourceTreeMutationActionSchema,
  affectedParentIds: z.array(adminResourceFolderIdSchema.nullable()),
  nodeId: adminResourceIdSchema,
  revision: adminResourceRevisionSchema,
  type: z.literal("resource-tree-mutated"),
})

export const adminResourceDocumentTitleConfirmedEventSchema = z.object({
  documentId: adminResourceDocumentIdSchema,
  name: adminResourceNameSchema,
  revision: adminResourceRevisionSchema,
  type: z.literal("resource-document-title-confirmed"),
})

export const adminResourceEventSchema = z.discriminatedUnion("type", [
  adminResourceTreeMutationEventSchema,
  adminResourceDocumentTitleConfirmedEventSchema,
])

export type AdminResourceEvent = z.infer<typeof adminResourceEventSchema>
export type AdminResourceTreeMutationAction = z.infer<
  typeof adminResourceTreeMutationActionSchema
>
