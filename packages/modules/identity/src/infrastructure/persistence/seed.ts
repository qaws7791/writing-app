import type { WritingAppDatabase } from "@workspace/db/client"
import type { AdminId, UserId } from "@workspace/types/ids"

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
    .onConflictDoUpdate({
      set: {
        deletedAt: null,
        displayName: input.displayName,
        status: userStatuses.active,
        version: 0,
      },
      target: learnerProfiles.userId,
    })
    .run()
}

export function seedOwnerIdentity(
  database: Pick<WritingAppDatabase, "insert">,
  adminId: AdminId
): void {
  seedAdminIdentity(database, { adminId, role: adminRoles.owner })
}

export function seedAdminIdentity(
  database: Pick<WritingAppDatabase, "insert">,
  input: Readonly<{ adminId: AdminId; role: AdminRole }>
): void {
  database
    .insert(adminIdentityProfiles)
    .values({ adminId: input.adminId, role: input.role, version: 0 })
    .onConflictDoUpdate({
      set: { role: input.role },
      target: adminIdentityProfiles.adminId,
    })
    .run()
}
