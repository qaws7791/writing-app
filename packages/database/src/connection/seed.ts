import { seedPrompts } from "../seed-data/index.js"
import { account, prompts, user } from "../schema/index.js"
import type { DbClient } from "../types/index.js"

export type SeedTestUser = {
  accountRecordId: string
  email: string
  name: string
  passwordHash: string
  userId: string
}

export function seedDatabase(database: DbClient): void {
  const now = new Date().toISOString()

  database.transaction((tx) => {
    for (const prompt of seedPrompts) {
      tx.insert(prompts)
        .values({
          createdAt: now,
          description: prompt.description,
          id: prompt.id,
          isTodayRecommended: false,
          level: prompt.level,
          outlineJson: prompt.outline,
          slug: `prompt-${prompt.id}`,
          suggestedLengthLabel: prompt.suggestedLengthLabel,
          tagsJson: prompt.tags,
          text: prompt.text,
          tipsJson: prompt.tips,
          todayRecommendationOrder: null,
          topic: prompt.topic,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          set: {
            description: prompt.description,
            level: prompt.level,
            outlineJson: prompt.outline,
            slug: `prompt-${prompt.id}`,
            suggestedLengthLabel: prompt.suggestedLengthLabel,
            tagsJson: prompt.tags,
            text: prompt.text,
            tipsJson: prompt.tips,
            topic: prompt.topic,
            updatedAt: now,
          },
          target: prompts.id,
        })
        .run()
    }
  })
}

export function seedTestUsers(
  database: DbClient,
  testUsers: SeedTestUser[]
): void {
  if (testUsers.length === 0) return

  const now = new Date()

  database.transaction((tx) => {
    for (const testUser of testUsers) {
      tx.insert(user)
        .values({
          createdAt: now,
          email: testUser.email,
          emailVerified: true,
          id: testUser.userId,
          name: testUser.name,
          updatedAt: now,
        })
        .onConflictDoNothing()
        .run()

      tx.insert(account)
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
        .run()
    }
  })
}
