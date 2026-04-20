import { and, asc, count, eq } from "drizzle-orm"

import {
  comparisonSessionStepAiStateSchema,
  createValidationError,
  feedbackSessionStepAiStateSchema,
  type RevisionComparison,
  stepResponseMapSchema,
  type WritingFeedback,
} from "@workspace/core"
import type {
  JourneyId,
  ProgressRepository,
  UserJourneyListItem,
  JourneyCategory,
  JourneyProgressStatus,
  SessionProgressStatus,
  SessionAiStateKind,
  SessionAiStateStatus,
  SessionAiResult,
  SessionId,
  StepResponseMap,
  UserId,
  UserJourneyProgress,
  UserSessionProgress,
  UserSessionStepAiState,
} from "@workspace/core"

import { journeys } from "../schema/journeys"
import { userJourneyProgress } from "../schema/user-journey-progress"
import { userSessionProgress } from "../schema/user-session-progress"
import { userSessionStepAiState } from "../schema/user-session-step-ai-state"
import { journeySessions } from "../schema/journey-sessions"
import type { DbExecutor } from "../types/index"

function parseStepResponsesJson(input: unknown): StepResponseMap {
  const parsed = stepResponseMapSchema.safeParse(input ?? {})

  if (parsed.success) {
    return parsed.data
  }

  throw createValidationError(
    "손상된 세션 응답 데이터입니다.",
    "stepResponsesJson"
  )
}

function parseSessionAiResultJson(
  kind: "feedback",
  input: unknown
): WritingFeedback | null
function parseSessionAiResultJson(
  kind: "comparison",
  input: unknown
): RevisionComparison | null
function parseSessionAiResultJson(
  kind: SessionAiStateKind,
  input: unknown
): SessionAiResult | null {
  const resultJsonSchema =
    kind === "feedback"
      ? feedbackSessionStepAiStateSchema.shape.resultJson
      : comparisonSessionStepAiStateSchema.shape.resultJson

  const parsed = resultJsonSchema.safeParse(input ?? null)

  if (parsed.success) {
    return parsed.data
  }

  throw createValidationError("손상된 세션 AI 결과 데이터입니다.", "resultJson")
}

function mapJourneyProgress(row: {
  userId: UserId
  journeyId: JourneyId
  currentSessionOrder: number
  completionRate: number
  status: string
}): UserJourneyProgress {
  return {
    userId: row.userId,
    journeyId: row.journeyId,
    currentSessionOrder: row.currentSessionOrder,
    completionRate: row.completionRate,
    status: row.status as JourneyProgressStatus,
  }
}

function mapUserJourneyListItem(row: {
  journeyId: JourneyId
  currentSessionOrder: number
  completionRate: number
  status: string
  title: string
  description: string
  category: string
  thumbnailUrl: string | null
  sessionCount: number | null
}): UserJourneyListItem {
  return {
    id: row.journeyId,
    title: row.title,
    description: row.description,
    category: row.category as JourneyCategory,
    thumbnailUrl: row.thumbnailUrl,
    sessionCount: Number(row.sessionCount ?? 0),
    currentSessionOrder: row.currentSessionOrder,
    completionRate: row.completionRate,
    status: row.status as JourneyProgressStatus,
  }
}

function mapSessionProgress(row: {
  userId: UserId
  sessionId: SessionId
  currentStepOrder: number
  status: string
  stepResponsesJson: unknown
}): UserSessionProgress {
  return {
    userId: row.userId,
    sessionId: row.sessionId,
    currentStepOrder: row.currentStepOrder,
    status: row.status as SessionProgressStatus,
    stepResponsesJson: parseStepResponsesJson(row.stepResponsesJson),
  }
}

function mapSessionStepAiState(row: {
  userId: UserId
  sessionId: SessionId
  stepOrder: number
  kind: string
  sourceStepOrder: number
  status: string
  attemptCount: number
  inputJson: unknown
  resultJson: unknown
  errorMessage: string | null
  updatedAt: Date
}): UserSessionStepAiState {
  const common = {
    userId: row.userId,
    sessionId: row.sessionId,
    stepOrder: row.stepOrder,
    sourceStepOrder: row.sourceStepOrder,
    status: row.status as SessionAiStateStatus,
    attemptCount: row.attemptCount,
    inputJson: (row.inputJson ?? {}) as Record<string, unknown>,
    errorMessage: row.errorMessage,
    updatedAt: row.updatedAt.toISOString(),
  }

  if (row.kind === "feedback") {
    return {
      ...common,
      kind: "feedback",
      resultJson: parseSessionAiResultJson("feedback", row.resultJson),
    }
  }

  return {
    ...common,
    kind: "comparison",
    resultJson: parseSessionAiResultJson("comparison", row.resultJson),
  }
}

export function createProgressRepository(
  database: DbExecutor
): ProgressRepository {
  const journeySessionCountSq = database
    .select({
      journeyId: journeySessions.journeyId,
      sessionCount: count().as("sessionCount"),
    })
    .from(journeySessions)
    .groupBy(journeySessions.journeyId)
    .as("journey_session_count_sq")

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
            eq(userJourneyProgress.userId, userId),
            eq(userJourneyProgress.journeyId, journeyId)
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
            eq(userJourneyProgress.userId, userId),
            eq(userJourneyProgress.status, "in_progress")
          )
        )

      return rows.map(mapJourneyProgress)
    },

    async listCompletedJourneys(
      userId: UserId
    ): Promise<UserJourneyProgress[]> {
      const rows = await database
        .select()
        .from(userJourneyProgress)
        .where(
          and(
            eq(userJourneyProgress.userId, userId),
            eq(userJourneyProgress.status, "completed")
          )
        )

      return rows.map(mapJourneyProgress)
    },

    async listUserJourneyItems(
      userId: UserId,
      status: JourneyProgressStatus
    ): Promise<UserJourneyListItem[]> {
      const rows = await database
        .select({
          journeyId: userJourneyProgress.journeyId,
          currentSessionOrder: userJourneyProgress.currentSessionOrder,
          completionRate: userJourneyProgress.completionRate,
          status: userJourneyProgress.status,
          title: journeys.title,
          description: journeys.description,
          category: journeys.category,
          thumbnailUrl: journeys.thumbnailUrl,
          sessionCount: journeySessionCountSq.sessionCount,
        })
        .from(userJourneyProgress)
        .innerJoin(journeys, eq(userJourneyProgress.journeyId, journeys.id))
        .leftJoin(
          journeySessionCountSq,
          eq(journeySessionCountSq.journeyId, journeys.id)
        )
        .where(
          and(
            eq(userJourneyProgress.userId, userId),
            eq(userJourneyProgress.status, status)
          )
        )

      return rows.map(mapUserJourneyListItem)
    },

    async enrollJourney(
      userId: UserId,
      journeyId: JourneyId
    ): Promise<UserJourneyProgress> {
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
        if (!existing) {
          throw new Error("여정 진행 상태를 찾지 못했습니다.")
        }

        return existing
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
            eq(userJourneyProgress.userId, userId),
            eq(userJourneyProgress.journeyId, journeyId)
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
        .where(eq(journeySessions.journeyId, journeyId))
        .orderBy(journeySessions.order)

      if (sessions.length === 0) return

      const now = new Date()
      const records = sessions.map((session) => ({
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

      await database
        .insert(userSessionProgress)
        .values(records)
        .onConflictDoNothing()
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
            eq(userSessionProgress.userId, userId),
            eq(userSessionProgress.sessionId, sessionId)
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
        .then((rows) => rows[0])

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
    ): Promise<void> {
      const stepResponsesJson =
        update.stepResponsesJson !== undefined
          ? parseStepResponsesJson(update.stepResponsesJson)
          : undefined

      await database
        .update(userSessionProgress)
        .set({
          ...(update.currentStepOrder !== undefined && {
            currentStepOrder: update.currentStepOrder,
          }),
          ...(update.status !== undefined && { status: update.status }),
          ...(stepResponsesJson !== undefined && {
            stepResponsesJson,
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

    async getSessionStepAiState(
      userId: UserId,
      sessionId: SessionId,
      stepOrder: number
    ): Promise<UserSessionStepAiState | null> {
      const row = await database
        .select()
        .from(userSessionStepAiState)
        .where(
          and(
            eq(userSessionStepAiState.userId, userId),
            eq(userSessionStepAiState.sessionId, sessionId),
            eq(userSessionStepAiState.stepOrder, stepOrder)
          )
        )
        .limit(1)
        .then((rows) => rows[0] ?? null)

      if (!row) return null
      return mapSessionStepAiState(row)
    },

    async listSessionStepAiStates(
      userId: UserId,
      sessionId: SessionId
    ): Promise<UserSessionStepAiState[]> {
      const rows = await database
        .select()
        .from(userSessionStepAiState)
        .where(
          and(
            eq(userSessionStepAiState.userId, userId),
            eq(userSessionStepAiState.sessionId, sessionId)
          )
        )
        .orderBy(asc(userSessionStepAiState.stepOrder))

      return rows.map(mapSessionStepAiState)
    },

    async listPendingSessionStepAiStates(
      limit: number
    ): Promise<UserSessionStepAiState[]> {
      const rows = await database
        .select()
        .from(userSessionStepAiState)
        .where(eq(userSessionStepAiState.status, "pending"))
        .orderBy(asc(userSessionStepAiState.updatedAt))
        .limit(limit)

      return rows.map(mapSessionStepAiState)
    },

    async claimPendingSessionStepAiState(input): Promise<boolean> {
      const claimedRows = await database
        .update(userSessionStepAiState)
        .set({ updatedAt: new Date() })
        .where(
          and(
            eq(userSessionStepAiState.userId, input.userId),
            eq(userSessionStepAiState.sessionId, input.sessionId),
            eq(userSessionStepAiState.stepOrder, input.stepOrder),
            eq(userSessionStepAiState.status, "pending"),
            eq(userSessionStepAiState.updatedAt, new Date(input.updatedAt))
          )
        )
        .returning({ id: userSessionStepAiState.id })

      return claimedRows.length > 0
    },

    async saveSessionStepAiState(
      userId: UserId,
      sessionId: SessionId,
      stepOrder: number,
      state: {
        kind: SessionAiStateKind
        sourceStepOrder: number
        status: SessionAiStateStatus
        attemptCount: number
        inputJson: Record<string, unknown>
        resultJson: SessionAiResult | null
        errorMessage: string | null
      }
    ): Promise<void> {
      const now = new Date()

      await database
        .insert(userSessionStepAiState)
        .values({
          userId,
          sessionId,
          stepOrder,
          kind: state.kind,
          sourceStepOrder: state.sourceStepOrder,
          status: state.status,
          attemptCount: state.attemptCount,
          inputJson: state.inputJson,
          resultJson: state.resultJson,
          errorMessage: state.errorMessage,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            userSessionStepAiState.userId,
            userSessionStepAiState.sessionId,
            userSessionStepAiState.stepOrder,
          ],
          set: {
            kind: state.kind,
            sourceStepOrder: state.sourceStepOrder,
            status: state.status,
            attemptCount: state.attemptCount,
            inputJson: state.inputJson,
            resultJson: state.resultJson,
            errorMessage: state.errorMessage,
            updatedAt: now,
          },
        })
    },
  }
}
