import { z } from "zod"

export const adminRoles = {
  operator: "operator",
  owner: "owner",
} as const
export const adminRoleValues = [adminRoles.owner, adminRoles.operator] as const
export const adminRoleSchema = z.enum(adminRoleValues)

export const adminSessionDtoSchema = z.object({
  admin: z.object({
    email: z.email(),
    id: z.string().min(1).max(200),
    name: z.string().min(1).max(200),
    role: adminRoleSchema,
  }),
})

export type AdminRole = z.infer<typeof adminRoleSchema>
export type AdminSessionDto = z.infer<typeof adminSessionDtoSchema>
