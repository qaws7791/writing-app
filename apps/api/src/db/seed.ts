import { seedLearnerAuth } from "@workspace/auth/seed"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { seedContentDatabase } from "@workspace/content/application"
import type { WritingAppDatabaseClient } from "@workspace/db/client"
import { seedLearnerIdentity } from "@workspace/identity/seed"

import { runApplicationMigrations } from "@/db/migrate"

const seedTime = new Date("2026-06-14T00:00:00.000Z")
const seedLearnerId = userIdSchema.parse("user-1")

export async function seedApplicationDatabase(
  client: WritingAppDatabaseClient
): Promise<void> {
  runApplicationMigrations(client.sqlite)
  seedLearnerAuth(client.db, {
    email: "learner@example.com",
    name: "글쓰기 탐험가",
    now: seedTime,
    userId: seedLearnerId,
  })
  await seedContentDatabase(client.db)
  seedLearnerIdentity(client.db, {
    displayName: "글쓰기 탐험가",
    userId: seedLearnerId,
  })
}
