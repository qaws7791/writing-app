import { z } from "zod"

import {
  adminResourceBreadcrumbItemDtoSchema,
  adminResourceDocumentIdSchema,
  adminResourceNameSchema,
  adminResourceVersionSchema,
} from "#contracts/resource-library/shared"

export const adminResourceSearchItemDtoSchema = z.object({
  excerpt: z.string().nullable(),
  id: adminResourceDocumentIdSchema,
  name: adminResourceNameSchema,
  path: z.array(adminResourceBreadcrumbItemDtoSchema),
  version: adminResourceVersionSchema,
})

export const adminResourceSearchDtoSchema = z.object({
  items: z.array(adminResourceSearchItemDtoSchema),
})

export type AdminResourceSearchDto = z.infer<
  typeof adminResourceSearchDtoSchema
>
export type AdminResourceSearchItemDto = z.infer<
  typeof adminResourceSearchItemDtoSchema
>
