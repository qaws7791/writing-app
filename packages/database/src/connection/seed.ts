import { and, eq } from "drizzle-orm"

import { account, user } from "../schema/index"
import { seedWritingPrompts, seedJourneys } from "../seed-data/index"
import { writingPrompts } from "../schema/writing-prompts"
import { journeys } from "../schema/journeys"
import { journeySessions } from "../schema/journey-sessions"
import { steps } from "../schema/steps"
import type { DbClient } from "../types/index"

export type SeedTestUser = {
  accountRecordId: string
  email: string
  name: string
  passwordHash: string
  userId: string
}

export async function seedDatabase(
  database: DbClient,
  rawJourneys?: unknown[]
): Promise<void> {
  const prompts = seedWritingPrompts()

  for (const prompt of prompts) {
    await database.insert(writingPrompts).values(prompt).onConflictDoNothing()
  }

  if (rawJourneys && rawJourneys.length > 0) {
    const journeyData = seedJourneys(
      rawJourneys as Parameters<typeof seedJourneys>[0]
    )

    for (const journey of journeyData) {
      const existingJourney = await database
        .select({ id: journeys.id })
        .from(journeys)
        .where(eq(journeys.title, journey.title))
        .limit(1)
        .then((rows) => rows[0] ?? null)

      const journeyId = existingJourney
        ? existingJourney.id
        : await database
            .insert(journeys)
            .values({
              title: journey.title,
              description: journey.description,
              category: journey.category,
              thumbnailUrl: journey.thumbnailUrl,
            })
            .returning({ id: journeys.id })
            .then((rows) => rows[0]?.id)

      if (!journeyId) continue

      for (const session of journey.sessions) {
        const existingSession = await database
          .select({ id: journeySessions.id })
          .from(journeySessions)
          .where(
            and(
              eq(journeySessions.journeyId, journeyId),
              eq(journeySessions.order, session.order)
            )
          )
          .limit(1)
          .then((rows) => rows[0] ?? null)

        const sessionId = existingSession
          ? existingSession.id
          : await database
              .insert(journeySessions)
              .values({
                journeyId,
                order: session.order,
                title: session.title,
                description: session.description,
                estimatedMinutes: session.estimatedMinutes,
              })
              .returning({ id: journeySessions.id })
              .then((rows) => rows[0]?.id)

        if (!sessionId) continue

        for (const step of session.steps) {
          const existingStep = await database
            .select({ id: steps.id })
            .from(steps)
            .where(
              and(eq(steps.sessionId, sessionId), eq(steps.order, step.order))
            )
            .limit(1)
            .then((rows) => rows[0] ?? null)

          if (existingStep) {
            continue
          }

          await database.insert(steps).values({
            sessionId,
            order: step.order,
            type: step.type,
            contentJson: step.contentJson,
          })
        }
      }
    }
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
