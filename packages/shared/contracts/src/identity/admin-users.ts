import { z } from "zod"
import { userIdSchema } from "#contracts/identity/admin-ids"
import { learnerAccountStatusSchema } from "#contracts/identity/status"
import { nonNegativeIntegerSchema as adminNonNegativeIntegerSchema } from "#contracts/shared/integer"
import {
  adminUserListStatusFilterSchema,
  adminUserSortSchema,
} from "#contracts/identity/status"
import { createIndexedSubstringQuerySchema } from "#contracts/shared/indexed-substring-query"

export const adminUsersQuerySchema = z.object({
  cursor: z.string().min(1).max(2_048).optional(),
  direction: z.enum(["next", "previous"]).optional().default("next"),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  query: createIndexedSubstringQuerySchema(100).optional().default(""),
  sort: adminUserSortSchema.optional().default("lastActive"),
  status: adminUserListStatusFilterSchema.optional().default("all"),
})

export const adminUserParamsSchema = z.object({
  userId: userIdSchema,
})

export const adminUserListItemDtoSchema = z.strictObject({
  email: z.email(),
  id: userIdSchema,
  joined: z.string(),
  lastActive: z.string().nullable(),
  lessonsDone: adminNonNegativeIntegerSchema,
  name: z.string(),
  status: learnerAccountStatusSchema,
  streak: adminNonNegativeIntegerSchema,
})

export const adminUserListDtoSchema = z.strictObject({
  items: z.array(adminUserListItemDtoSchema),
  pagination: z.strictObject({
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    nextCursor: z.string().min(1).nullable(),
    pageSize: z.number().int().positive().max(100),
    previousCursor: z.string().min(1).nullable(),
  }),
})

export const adminUserDetailDtoSchema = adminUserListItemDtoSchema.extend({
  progressPercent: adminNonNegativeIntegerSchema.max(100),
  totalLessons: adminNonNegativeIntegerSchema,
})

export const adminDeleteUserResultSchema = z.strictObject({
  deleted: z.literal(true),
})

export type AdminDeleteUserResultDto = z.infer<
  typeof adminDeleteUserResultSchema
>
export type AdminUserListItemDto = z.infer<typeof adminUserListItemDtoSchema>
export type AdminUserDetailDto = z.infer<typeof adminUserDetailDtoSchema>
export type AdminUserListDto = z.infer<typeof adminUserListDtoSchema>
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>
