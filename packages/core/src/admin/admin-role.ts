import { z } from "zod"
import {
  persistedAdminRoles,
  persistedAdminRoleValues,
} from "@workspace/db/persisted-values"

export const adminRoles = persistedAdminRoles
export const adminRoleValues = persistedAdminRoleValues

export const adminRoleSchema = z.enum(adminRoleValues)

export type AdminRole = z.infer<typeof adminRoleSchema>

export function parseAdminRole(role: unknown): AdminRole | null {
  const result = adminRoleSchema.safeParse(role)

  return result.success ? result.data : null
}

export function canAccessOwnerAdminRoute(role: AdminRole): boolean {
  return role === adminRoles.owner
}
