import { account, user } from "../schema/index"
import { seedWritingPrompts } from "../seed-data/index"
import { writingPrompts } from "../schema/writing-prompts"
import type { DbClient } from "../types/index"

export type SeedTestUser = {
  accountRecordId: string
  email: string
  name: string
  passwordHash: string
  userId: string
}

export async function seedDatabase(database: DbClient): Promise<void> {
  const prompts = seedWritingPrompts()

  for (const prompt of prompts) {
    await database.insert(writingPrompts).values(prompt).onConflictDoNothing()
  }
}

export async function seedTestUsers(
  database: DbClient,
  testUsers: SeedTestUser[]
): Promise<void> {
  if (testUsers.length === 0) return

  const now = new Date()

  for (const testUser of testUsers) {
    await database
      .insert(user)
      .values({
        createdAt: now,
        email: testUser.email,
        emailVerified: true,
        id: testUser.userId,
        name: testUser.name,
        updatedAt: now,
      })
      .onConflictDoNothing()

    await database
      .insert(account)
      .values({
        accountId: testUser.userId,
        createdAt: now,
        id: testUser.accountRecordId,
        password: testUser.passwordHash,
        providerId: "credential",
        updatedAt: now,
        userId: testUser.userId,
      })
      .onConflictDoNothing()
  }
}
