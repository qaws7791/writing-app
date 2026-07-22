import type { WritingAppDatabase } from "@workspace/db/client"
import type { AdminId, UserId } from "@workspace/types/ids"

import { adminRoles } from "#identity/domain/admin-role"
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
  database
    .insert(adminIdentityProfiles)
    .values({ adminId, role: adminRoles.owner, version: 0 })
    .onConflictDoUpdate({
      set: { role: adminRoles.owner },
      target: adminIdentityProfiles.adminId,
    })
    .run()
}
