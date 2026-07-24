import type { WritingAppDatabase } from "@workspace/db/client"
import type { UserId } from "@workspace/types/ids"

import { userStatuses } from "#identity/domain/user-status"
import { learnerProfiles } from "#identity/infrastructure/persistence/schema"

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
