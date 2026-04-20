import { and, eq } from "drizzle-orm"

import type { SessionId, UserId } from "@workspace/core"
import type {
  ProgressRepository,
  SessionProgressStatus,
  StepResponseMap,
} from "@workspace/core/modules/progress"

import { journeySessions } from "../schema/journey-sessions"
import { userSessionProgress } from "../schema/user-session-progress"
import type { DbExecutor } from "../types/index"
import {
  mapSessionProgress,
  normalizeStepResponsesJson,
} from "./progress.repository-mappers"

type SessionProgressMethods = Pick<
  ProgressRepository,
  | "getSessionProgress"
  | "initSessionProgressForJourney"
  | "startSession"
  | "updateSessionProgress"
>

export function createSessionProgressMethods(
  database: DbExecutor
): SessionProgressMethods {
  return {
    async initSessionProgressForJourney(userId, journeyId) {
      const sessions = await database
        .select({ id: journeySessions.id, order: journeySessions.order })
        .from(journeySessions)
        .where(eq(journeySessions.journeyId, journeyId))
        .orderBy(journeySessions.order)

      if (sessions.length === 0) {
        return
      }

      const now = new Date()
      await database
        .insert(userSessionProgress)
        .values(
          sessions.map((session) => ({
            userId,
            sessionId: session.id,
            currentStepOrder: 1,
            status: (session.order === 1 ? "in_progress" : "locked") as
              | "in_progress"
              | "locked",
            stepResponsesJson: {},
            createdAt: now,
            updatedAt: now,
          }))
        )
        .onConflictDoNothing()
    },

    async getSessionProgress(userId: UserId, sessionId: SessionId) {
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

      return row ? mapSessionProgress(row) : null
    },

    async startSession(userId: UserId, sessionId: SessionId) {
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
        .then((rows) => rows[0] ?? null)

      if (!row) {
        throw new Error("세션 진행 상태를 시작하지 못했습니다.")
      }

      return mapSessionProgress(row)
    },

    async updateSessionProgress(
      userId: UserId,
      sessionId: SessionId,
      update: {
        currentStepOrder?: number
        status?: SessionProgressStatus
        stepResponsesJson?: StepResponseMap
      }
    ) {
      const stepResponsesJson =
        update.stepResponsesJson !== undefined
          ? normalizeStepResponsesJson(update.stepResponsesJson)
          : undefined

      await database
        .update(userSessionProgress)
        .set({
          ...(update.currentStepOrder !== undefined && {
            currentStepOrder: update.currentStepOrder,
          }),
          ...(update.status !== undefined && { status: update.status }),
          ...(stepResponsesJson !== undefined && { stepResponsesJson }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userSessionProgress.userId, userId),
            eq(userSessionProgress.sessionId, sessionId)
          )
        )
    },
  }
}
