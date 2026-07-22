import { eq } from "drizzle-orm"
import { authUsers } from "@workspace/auth/schema"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { IdentityApplication } from "@workspace/identity/application"

export function createLearnerTestAuthDisplayNameSynchronizer(
  database: WritingAppDatabase,
  application: Pick<IdentityApplication, "changeLearnerDisplayName">
) {
  return {
    async synchronizeDisplayName(input: {
      readonly displayName: string
      readonly updatedAt: Date
      readonly userId: string
    }) {
      const userId = userIdSchema.parse(input.userId)
      const changed = await application.changeLearnerDisplayName({
        displayName: input.displayName,
        userId,
      })
      if (changed.isErr()) {
        throw new Error(
          `identity display name synchronization failed: ${changed.error.kind}`
        )
      }

      database
        .update(authUsers)
        .set({ name: input.displayName, updatedAt: input.updatedAt })
        .where(eq(authUsers.id, input.userId))
        .run()
    },
  }
}
