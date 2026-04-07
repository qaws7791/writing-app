import { and, eq } from "drizzle-orm"

import type {
  UserId,
  JourneyId,
  SessionId,
  ProgressRepository,
  UserJourneyProgress,
  UserSessionProgress,
  JourneyProgressStatus,
  SessionProgressStatus,
} from "@workspace/core"

import { userJourneyProgress } from "../schema/user-journey-progress"
import { userSessionProgress } from "../schema/user-session-progress"
import { journeySessions } from "../schema/journey-sessions"
import type { DbClient } from "../types/index"

function mapJourneyProgress(row: {
  userId: string
  journeyId: number
  currentSessionOrder: number
  completionRate: number
  status: string
}): UserJourneyProgress {
  return {
    userId: row.userId as unknown as UserId,
    journeyId: row.journeyId as unknown as JourneyId,
    currentSessionOrder: row.currentSessionOrder,
    completionRate: row.completionRate,
    status: row.status as JourneyProgressStatus,
  }
}

function mapSessionProgress(row: {
  userId: string
  sessionId: number
  currentStepOrder: number
  status: string
  stepResponsesJson: unknown
}): UserSessionProgress {
  return {
    userId: row.userId as unknown as UserId,
    sessionId: row.sessionId as unknown as SessionId,
    currentStepOrder: row.currentStepOrder,
    status: row.status as SessionProgressStatus,
    stepResponsesJson: (row.stepResponsesJson ?? {}) as Record<string, unknown>,
  }
}

export function createProgressRepository(
  database: DbClient
): ProgressRepository {
  return {
    async getJourneyProgress(
      userId: UserId,
      journeyId: JourneyId
    ): Promise<UserJourneyProgress | null> {
      const row = await database
        .select()
        .from(userJourneyProgress)
        .where(
          and(
            eq(userJourneyProgress.userId, userId as unknown as string),
            eq(userJourneyProgress.journeyId, journeyId as unknown as number)
          )
        )
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (!row) return null
      return mapJourneyProgress(row)
    },

    async listActiveJourneys(userId: UserId): Promise<UserJourneyProgress[]> {
      const rows = await database
        .select()
        .from(userJourneyProgress)
        .where(
          and(
            eq(userJourneyProgress.userId, userId as unknown as string),
            eq(userJourneyProgress.status, "in_progress")
          )
        )

      return rows.map(mapJourneyProgress)
    },

    async enrollJourney(
      userId: UserId,
      journeyId: JourneyId
    ): Promise<UserJourneyProgress> {
      const now = new Date()
      const row = await database
        .insert(userJourneyProgress)
        .values({
          userId: userId as unknown as string,
          journeyId: journeyId as unknown as number,
          currentSessionOrder: 1,
          completionRate: 0,
          status: "in_progress",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing()
        .returning()
        .then((rows) => rows[0])

      if (!row) {
        const existing = await this.getJourneyProgress(userId, journeyId)
        return existing!
      }

      return mapJourneyProgress(row)
    },

    async updateJourneyProgress(
      userId: UserId,
      journeyId: JourneyId,
      update: {
        currentSessionOrder?: number
        completionRate?: number
        status?: JourneyProgressStatus
      }
    ): Promise<void> {
      await database
        .update(userJourneyProgress)
        .set({
          ...(update.currentSessionOrder !== undefined && {
            currentSessionOrder: update.currentSessionOrder,
          }),
          ...(update.completionRate !== undefined && {
            completionRate: update.completionRate,
          }),
          ...(update.status !== undefined && { status: update.status }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userJourneyProgress.userId, userId as unknown as string),
            eq(userJourneyProgress.journeyId, journeyId as unknown as number)
          )
        )
    },

    async initSessionProgressForJourney(
      userId: UserId,
      journeyId: JourneyId
    ): Promise<void> {
      const sessions = await database
        .select({ id: journeySessions.id, order: journeySessions.order })
        .from(journeySessions)
        .where(eq(journeySessions.journeyId, journeyId as unknown as number))
        .orderBy(journeySessions.order)

      const now = new Date()
      for (const session of sessions) {
        await database
          .insert(userSessionProgress)
          .values({
            userId: userId as unknown as string,
            sessionId: session.id,
            currentStepOrder: 1,
            status: session.order === 1 ? "in_progress" : "locked",
            stepResponsesJson: {},
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing()
      }
    },

    async getSessionProgress(
      userId: UserId,
      sessionId: SessionId
    ): Promise<UserSessionProgress | null> {
      const row = await database
        .select()
        .from(userSessionProgress)
        .where(
          and(
            eq(userSessionProgress.userId, userId as unknown as string),
            eq(userSessionProgress.sessionId, sessionId as unknown as number)
          )
        )
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (!row) return null
      return mapSessionProgress(row)
    },

    async startSession(
      userId: UserId,
      sessionId: SessionId
    ): Promise<UserSessionProgress> {
      const now = new Date()
      const row = await database
        .insert(userSessionProgress)
        .values({
          userId: userId as unknown as string,
          sessionId: sessionId as unknown as number,
          currentStepOrder: 1,
          status: "in_progress",
          stepResponsesJson: {},
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          set: { status: "in_progress", updatedAt: now },
          target: [userSessionProgress.userId, userSessionProgress.sessionId],
        })
        .returning()
        .then((rows) => rows[0]!)

      return mapSessionProgress(row)
    },

    async updateSessionProgress(
      userId: UserId,
      sessionId: SessionId,
      update: {
        currentStepOrder?: number
        status?: SessionProgressStatus
        stepResponsesJson?: Record<string, unknown>
      }
    ): Promise<void> {
      await database
        .update(userSessionProgress)
        .set({
          ...(update.currentStepOrder !== undefined && {
            currentStepOrder: update.currentStepOrder,
          }),
          ...(update.status !== undefined && { status: update.status }),
          ...(update.stepResponsesJson !== undefined && {
            stepResponsesJson: update.stepResponsesJson,
          }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userSessionProgress.userId, userId as unknown as string),
            eq(userSessionProgress.sessionId, sessionId as unknown as number)
          )
        )
    },
  }
}
