import type { JourneyId, SessionId, UserId } from "@workspace/core"
import type { JourneyCategory } from "@workspace/core/modules/journeys"
import type {
  JourneyProgressStatus,
  SessionAiStateStatus,
  SessionProgressStatus,
  StepResponseMap,
  UserJourneyListItem,
  UserJourneyProgress,
  UserSessionProgress,
  UserSessionStepAiState,
} from "@workspace/core/modules/progress"

import {
  parseSessionAiResultJson,
  parseStepResponsesJson,
} from "./progress.repository-parsers"

export function mapJourneyProgress(row: {
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

export function mapUserJourneyListItem(row: {
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

export function mapSessionProgress(row: {
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

export function mapSessionStepAiState(row: {
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

export function normalizeStepResponsesJson(
  value: StepResponseMap | unknown
): StepResponseMap {
  return parseStepResponsesJson(value)
}
