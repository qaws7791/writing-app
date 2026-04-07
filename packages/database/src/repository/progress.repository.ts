import { and, eq } from "drizzle-orm"

import {
  userJourneyProgress,
  type JourneyProgressStatus,
} from "../schema/user-journey-progress"
import {
  userSessionProgress,
  type SessionProgressStatus,
} from "../schema/user-session-progress"
import { journeySessions } from "../schema/journey-sessions"
import type { DbClient } from "../types/index"

export type UserJourneyProgressSummary = {
  id: number
  userId: string
  journeyId: number
  currentSessionOrder: number
  completionRate: number
  status: string
}

export type UserSessionProgressSummary = {
  id: number
  userId: string
  sessionId: number
  currentStepOrder: number
  status: string
  stepResponsesJson: unknown
}

export type ProgressRepository = {
  getJourneyProgress: (
    userId: string,
    journeyId: number
  ) => Promise<UserJourneyProgressSummary | null>
  listInProgressJourneys: (
    userId: string
  ) => Promise<UserJourneyProgressSummary[]>
  enrollJourney: (
    userId: string,
    journeyId: number
  ) => Promise<UserJourneyProgressSummary>
  updateJourneyProgress: (
    userId: string,
    journeyId: number,
    update: {
      currentSessionOrder?: number
      completionRate?: number
      status?: JourneyProgressStatus
    }
  ) => Promise<void>
  getSessionProgress: (
    userId: string,
    sessionId: number
  ) => Promise<UserSessionProgressSummary | null>
  startSession: (
    userId: string,
    sessionId: number
  ) => Promise<UserSessionProgressSummary>
  updateSessionProgress: (
    userId: string,
    sessionId: number,
    update: {
      currentStepOrder?: number
      status?: SessionProgressStatus
      stepResponsesJson?: unknown
    }
  ) => Promise<void>
  initSessionProgressForJourney: (
    userId: string,
    journeyId: number
  ) => Promise<void>
}

export function createProgressRepository(
  database: DbClient
): ProgressRepository {
  return {
    async getJourneyProgress(userId, journeyId) {
      const row = await database
        .select()
        .from(userJourneyProgress)
        .where(
          and(
            eq(userJourneyProgress.userId, userId),
            eq(userJourneyProgress.journeyId, journeyId)
          )
        )
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (!row) return null

      return {
        id: row.id,
        userId: row.userId,
        journeyId: row.journeyId,
        currentSessionOrder: row.currentSessionOrder,
        completionRate: row.completionRate,
        status: row.status,
      }
    },

    async listInProgressJourneys(userId) {
      const rows = await database
        .select()
        .from(userJourneyProgress)
        .where(
          and(
            eq(userJourneyProgress.userId, userId),
            eq(userJourneyProgress.status, "in_progress")
          )
        )

      return rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        journeyId: row.journeyId,
        currentSessionOrder: row.currentSessionOrder,
        completionRate: row.completionRate,
        status: row.status,
      }))
    },

    async enrollJourney(userId, journeyId) {
      const now = new Date()
      const row = await database
        .insert(userJourneyProgress)
        .values({
          userId,
          journeyId,
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

      return {
        id: row.id,
        userId: row.userId,
        journeyId: row.journeyId,
        currentSessionOrder: row.currentSessionOrder,
        completionRate: row.completionRate,
        status: row.status,
      }
    },

    async updateJourneyProgress(userId, journeyId, update) {
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
            eq(userJourneyProgress.userId, userId),
            eq(userJourneyProgress.journeyId, journeyId)
          )
        )
    },

    async getSessionProgress(userId, sessionId) {
      const row = await database
        .select()
        .from(userSessionProgress)
        .where(
          and(
            eq(userSessionProgress.userId, userId),
            eq(userSessionProgress.sessionId, sessionId)
          )
        )
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (!row) return null

      return {
        id: row.id,
        userId: row.userId,
        sessionId: row.sessionId,
        currentStepOrder: row.currentStepOrder,
        status: row.status,
        stepResponsesJson: row.stepResponsesJson,
      }
    },

    async startSession(userId, sessionId) {
      const now = new Date()
      const row = await database
        .insert(userSessionProgress)
        .values({
          userId,
          sessionId,
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

      return {
        id: row.id,
        userId: row.userId,
        sessionId: row.sessionId,
        currentStepOrder: row.currentStepOrder,
        status: row.status,
        stepResponsesJson: row.stepResponsesJson,
      }
    },

    async updateSessionProgress(userId, sessionId, update) {
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
            eq(userSessionProgress.userId, userId),
            eq(userSessionProgress.sessionId, sessionId)
          )
        )
    },

    async initSessionProgressForJourney(userId, journeyId) {
      const sessions = await database
        .select({ id: journeySessions.id, order: journeySessions.order })
        .from(journeySessions)
        .where(eq(journeySessions.journeyId, journeyId))
        .orderBy(journeySessions.order)

      const now = new Date()
      for (const session of sessions) {
        await database
          .insert(userSessionProgress)
          .values({
            userId,
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
  }
}
