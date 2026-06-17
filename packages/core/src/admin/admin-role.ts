import { z } from "zod"

export const adminRoles = {
  operator: "operator",
  owner: "owner",
} as const

export const adminRoleValues = [adminRoles.owner, adminRoles.operator] as const

export const adminRoleSchema = z.enum(adminRoleValues)

export type AdminRole = z.infer<typeof adminRoleSchema>

export function parseAdminRole(role: unknown): AdminRole | null {
  const result = adminRoleSchema.safeParse(role)

  return result.success ? result.data : null
}

export function canAccessOwnerAdminRoute(role: AdminRole): boolean {
  return role === adminRoles.owner
}
