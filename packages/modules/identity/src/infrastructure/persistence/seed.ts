import type { WritingAppDatabase } from "@workspace/db/client"
import type { AdminId, UserId } from "@workspace/types/ids"
import { eq } from "drizzle-orm"

import { adminRoles, type AdminRole } from "#identity/domain/admin-role"
import { userStatuses } from "#identity/domain/user-status"
import {
  adminIdentityProfiles,
  learnerProfiles,
} from "#identity/infrastructure/persistence/schema"

export function seedLearnerIdentity(
  database: WritingAppDatabase,
  input: Readonly<{
    displayName: string
    userId: UserId
  }>
): void {
  database
    .insert(learnerProfiles)
    .values({
      deletedAt: null,
      displayName: input.displayName,
      status: userStatuses.active,
      userId: input.userId,
      version: 0,
    })
    .onConflictDoNothing({ target: learnerProfiles.userId })
    .run()
}

export function seedOwnerIdentity(
  database: Pick<WritingAppDatabase, "insert">,
  adminId: AdminId
): void {
  seedAdminIdentity(database, { adminId, role: adminRoles.owner })
}

export function inspectOwnerIdentitySeedState(
  database: Pick<WritingAppDatabase, "select">,
  adminId: AdminId
): "missing" | "owner" | "role-conflict" {
  const identity = database
    .select({ role: adminIdentityProfiles.role })
    .from(adminIdentityProfiles)
    .where(eq(adminIdentityProfiles.adminId, adminId))
    .get()

  if (identity === undefined) return "missing"
  return identity.role === adminRoles.owner ? "owner" : "role-conflict"
}

export function seedAdminIdentity(
  database: Pick<WritingAppDatabase, "insert">,
  input: Readonly<{ adminId: AdminId; role: AdminRole }>
): void {
  database
    .insert(adminIdentityProfiles)
    .values({ adminId: input.adminId, role: input.role, version: 0 })
    .onConflictDoNothing({ target: adminIdentityProfiles.adminId })
    .run()
}
