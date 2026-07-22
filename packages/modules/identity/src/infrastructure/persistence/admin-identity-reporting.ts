import { asc } from "drizzle-orm"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { AdminId } from "@workspace/types/ids"

import type { AdminRole } from "#identity/domain/admin-role"
import { adminIdentityProfiles } from "#identity/infrastructure/persistence/schema"

export type AdminIdentityRoleEntry = Readonly<{
  adminId: AdminId
  role: AdminRole
}>

export function readAdminIdentityRoles(
  database: Pick<WritingAppDatabase, "select">
): readonly AdminIdentityRoleEntry[] {
  return database
    .select({
      adminId: adminIdentityProfiles.adminId,
      role: adminIdentityProfiles.role,
    })
    .from(adminIdentityProfiles)
    .orderBy(asc(adminIdentityProfiles.adminId))
    .all()
    .map((entry) => ({
      adminId: adminIdSchema.parse(entry.adminId),
      role: entry.role,
    }))
}
