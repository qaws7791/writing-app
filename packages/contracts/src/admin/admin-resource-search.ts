import { z } from "zod"

import {
  adminResourceBreadcrumbItemDtoSchema,
  adminResourceIdSchema,
  adminResourceNameSchema,
} from "@workspace/contracts/admin/admin-resource-library-shared"

const adminResourceSearchItemBaseDtoSchema = z.object({
  id: adminResourceIdSchema,
  name: adminResourceNameSchema,
  path: z.array(adminResourceBreadcrumbItemDtoSchema),
})

export const adminResourceFolderSearchItemDtoSchema =
  adminResourceSearchItemBaseDtoSchema.extend({
    excerpt: z.null(),
    kind: z.literal("folder"),
  })

export const adminResourceDocumentSearchItemDtoSchema =
  adminResourceSearchItemBaseDtoSchema.extend({
    excerpt: z.string().nullable(),
    kind: z.literal("document"),
  })

export const adminResourceSearchItemDtoSchema = z.discriminatedUnion("kind", [
  adminResourceFolderSearchItemDtoSchema,
  adminResourceDocumentSearchItemDtoSchema,
])

export const adminResourceSearchDtoSchema = z.object({
  items: z.array(adminResourceSearchItemDtoSchema),
})

export type AdminResourceSearchDto = z.infer<
  typeof adminResourceSearchDtoSchema
>
export type AdminResourceSearchItemDto = z.infer<
  typeof adminResourceSearchItemDtoSchema
>
