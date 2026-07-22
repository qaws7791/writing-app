import { z } from "zod"
import { userIdSchema } from "#contracts/identity/admin-ids"
import { adminUserStatusSchema } from "#contracts/identity/status"
import {
  nonNegativeIntegerSchema as adminNonNegativeIntegerSchema,
  positiveIntegerSchema as adminPositiveIntegerSchema,
} from "#contracts/shared/integer"

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
export type AdminUserListItemDto = z.infer<typeof adminUserListItemDtoSchema>
export type AdminUserDetailDto = z.infer<typeof adminUserDetailDtoSchema>
export type AdminUserListDto = z.infer<typeof adminUserListDtoSchema>
