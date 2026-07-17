import {
  adminRoles,
  adminRoleSchema,
  adminRoleValues,
  type AdminRole,
} from "@workspace/contracts/admin/identity-data"

export { adminRoles, adminRoleSchema, adminRoleValues }
export type { AdminRole }

export function parseAdminRole(role: unknown): AdminRole | null {
  const result = adminRoleSchema.safeParse(role)

  return result.success ? result.data : null
}

export function canAccessOwnerAdminRoute(role: AdminRole): boolean {
  return role === adminRoles.owner
}
