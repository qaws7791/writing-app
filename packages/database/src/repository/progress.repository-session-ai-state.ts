import { and, asc, eq } from "drizzle-orm"

import type {
  ProgressRepository,
  SessionAiResult,
  SessionAiStateKind,
  SessionAiStateStatus,
  SessionId,
  UserId,
} from "@workspace/core"

import { userSessionStepAiState } from "../schema/user-session-step-ai-state"
import type { DbExecutor } from "../types/index"
import { mapSessionStepAiState } from "./progress.repository-mappers"

type SessionAiStateMethods = Pick<
  ProgressRepository,
  | "claimPendingSessionStepAiState"
  | "getSessionStepAiState"
  | "listPendingSessionStepAiStates"
  | "listSessionStepAiStates"
  | "saveSessionStepAiState"
>

export function createSessionAiStateMethods(
  database: DbExecutor
): SessionAiStateMethods {
  return {
    async getSessionStepAiState(
      userId: UserId,
      sessionId: SessionId,
      stepOrder
    ) {
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

      return row ? mapSessionStepAiState(row) : null
    },

    async listSessionStepAiStates(userId: UserId, sessionId: SessionId) {
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

    async listPendingSessionStepAiStates(limit: number) {
      const rows = await database
        .select()
        .from(userSessionStepAiState)
        .where(eq(userSessionStepAiState.status, "pending"))
        .orderBy(asc(userSessionStepAiState.updatedAt))
        .limit(limit)

      return rows.map(mapSessionStepAiState)
    },

    async claimPendingSessionStepAiState(input) {
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
    ) {
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
