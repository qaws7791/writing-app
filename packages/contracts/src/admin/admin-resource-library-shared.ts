import { z } from "zod"

import { adminNonNegativeIntegerSchema } from "@workspace/contracts/admin/admin-shared"

export const adminResourceNameMaxLength = 120
export const adminResourceMarkdownMaxLength = 200_000
export const adminResourceIdMaxLength = 128

export const adminResourceIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(adminResourceIdMaxLength)
export const adminResourceFolderIdSchema = adminResourceIdSchema
export const adminResourceDocumentIdSchema = adminResourceIdSchema
export const adminResourceNodeKindSchema = z.enum(["folder", "document"])
export const adminResourceNodeStatusSchema = z.enum(["active", "archived"])
export const adminResourceTreeScopeSchema = z.enum(["active", "trash"])
export const adminResourceRevisionSchema = adminNonNegativeIntegerSchema
export const adminResourceNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(adminResourceNameMaxLength)
  .regex(/^[^\p{Cc}]*$/u)

export const adminResourceBreadcrumbItemDtoSchema = z.object({
  id: adminResourceFolderIdSchema,
  name: adminResourceNameSchema,
})

export const adminResourceActorDtoSchema = z.object({
  email: z.string().email(),
  id: z.string().min(1),
  name: z.string().min(1),
})

export type AdminResourceActorDto = z.infer<typeof adminResourceActorDtoSchema>
export type AdminResourceBreadcrumbItemDto = z.infer<
  typeof adminResourceBreadcrumbItemDtoSchema
>
export type AdminResourceNodeKind = z.infer<typeof adminResourceNodeKindSchema>
export type AdminResourceNodeStatus = z.infer<
  typeof adminResourceNodeStatusSchema
>
export type AdminResourceTreeScope = z.infer<
  typeof adminResourceTreeScopeSchema
>
