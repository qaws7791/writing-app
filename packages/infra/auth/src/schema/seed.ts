import type { WritingAppDatabase } from "@workspace/db/client"

import { authUsers } from "#auth/schema/learner-auth.schema"

export async function seedLearnerAuth(
  database: WritingAppDatabase,
  input: Readonly<{
    email: string
    name: string
    now: Date
    userId: string
  }>
): Promise<void> {
  await database
    .insert(authUsers)
    .values({
      createdAt: input.now,
      email: input.email,
      emailVerified: true,
      id: input.userId,
      image: null,
      name: input.name,
      updatedAt: input.now,
    })
    .onConflictDoNothing({ target: authUsers.id })
    .run()
}
