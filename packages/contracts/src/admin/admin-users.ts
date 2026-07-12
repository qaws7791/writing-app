import { z } from "zod"
import { userIdSchema } from "@workspace/contracts/admin/admin-ids"
import {
  adminNonNegativeIntegerSchema,
  adminPositiveIntegerSchema,
  adminUserStatusSchema,
} from "@workspace/contracts/admin/admin-shared"

export const adminUserListItemDtoSchema = z.object({
  email: z.email(),
  id: userIdSchema,
  joined: z.string(),
  lastActive: z.string().nullable(),
  lessonsDone: adminNonNegativeIntegerSchema,
  name: z.string(),
  status: adminUserStatusSchema,
  streak: adminNonNegativeIntegerSchema,
})

export const adminUserListDtoSchema = z.object({
  items: z.array(adminUserListItemDtoSchema),
  pagination: z.object({
    page: adminPositiveIntegerSchema,
    pageSize: adminPositiveIntegerSchema,
    totalItems: adminNonNegativeIntegerSchema,
    totalPages: adminPositiveIntegerSchema,
  }),
})

export const adminUserDetailDtoSchema = adminUserListItemDtoSchema.extend({
  progressPercent: adminNonNegativeIntegerSchema.max(100),
  totalLessons: adminNonNegativeIntegerSchema,
})

export const adminDeleteUserResultSchema = z.object({
  deleted: z.literal(true),
})

export type AdminDeleteUserResultDto = z.infer<
  typeof adminDeleteUserResultSchema
>
export type AdminUserDetailDto = z.infer<typeof adminUserDetailDtoSchema>
export type AdminUserListDto = z.infer<typeof adminUserListDtoSchema>
