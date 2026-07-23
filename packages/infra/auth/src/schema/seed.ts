import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"

import { authUsers } from "#auth/schema/learner-auth.schema"

export function seedLearnerAuth(
  database: BunSQLiteDatabase,
  input: Readonly<{
    email: string
    name: string
    now: Date
    userId: string
  }>
): void {
  database
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
