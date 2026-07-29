import type { ContentApplication } from "@workspace/content/ports"
import type { LearnerAiFeedbackTransitionResult } from "@workspace/contracts/learning/learner-transition"
import type { WritingAppDatabase } from "@workspace/db/client"
import { assertExhaustiveHttpResult } from "@workspace/http-platform/errors"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { LearnerId, LessonId, LessonStepId } from "@workspace/types/ids"

import {
  createLearningApplication,
  type LearningApplication,
  type LearningCommandError,
} from "#learning/application/learning-application"
import {
  createLearningProfileStatsQuery,
  createLearningReportingQuery,
  type LearningProfileStats,
  type LearningReportingQuery,
} from "#learning/application/learning-reporting"
import type { LearningApplicationDependencies } from "#learning/application/ports/learning-ports"
import { createLearningContentQueryPort } from "#learning/infrastructure/adapters/content-query-adapter"
import { createDrizzleLearningReadRepository } from "#learning/infrastructure/persistence/learning-read-drizzle-repository"
import {
  createLearnerCursorCodec,
  type LearnerCursorCodec,
} from "#learning/infrastructure/persistence/learner-cursor"
import {
  createDrizzleLearningReportingRepository,
  toLearningUserId,
} from "#learning/infrastructure/persistence/learning-reporting-drizzle-repository"
import { createDrizzleLearnerTransitionRepository } from "#learning/infrastructure/persistence/learning-transition-drizzle-repository"
import { presentAiFeedbackResult } from "#learning/interface/http/learning-http-mapper"

export type LearningAiFeedbackHttpCommandError =
  | Readonly<{ kind: "invalid-request" }>
  | Readonly<{ kind: "lesson-not-found" }>
  | Readonly<{ kind: "lesson-locked" }>
  | Readonly<{ kind: "curriculum-version-changed" }>
  | Readonly<{ kind: "step-sequence-conflict" }>
  | Readonly<{ kind: "feedback-answer-not-found" }>
  | Readonly<{ kind: "feedback-target-invalid" }>
  | Readonly<{ kind: "attempt-limit-exceeded"; remainingAttempts: 0 }>
  | Readonly<{
      kind: "daily-quota-exceeded"
      remainingAttempts: number
      retryAfterSeconds: number
    }>
  | Readonly<{
      kind: "attempt-in-progress"
      remainingAttempts: number
      retryAfterSeconds: number
    }>
  | Readonly<{
      kind:
        | "persistence-failed"
        | "provider-response-invalid"
        | "provider-timeout"
        | "provider-unavailable"
        | "request-aborted"
    }>

export type LearningAiFeedbackHttpCommandPort = Readonly<{
  requestFeedback: (
    command: Readonly<{
      idempotencyKey: string
      learnerId: LearnerId
      lessonId: LessonId
      stepId: LessonStepId
    }>,
    options: Readonly<{ signal: AbortSignal }>
  ) => Promise<
    Result<
      LearnerAiFeedbackTransitionResult,
      LearningAiFeedbackHttpCommandError
    >
  >
}>

export type LearningModule = Readonly<{
  aiFeedbackCommand: LearningAiFeedbackHttpCommandPort
  application: LearningApplication
  cursor: LearnerCursorCodec
  profileStatsQuery: Readonly<{
    readProfileStats: (userId: string) => Promise<LearningProfileStats>
  }>
  reportingQuery: LearningReportingQuery
}>

export function createLearningModule(
  input: Omit<
    LearningApplicationDependencies,
    "content" | "readRepository" | "transitionRepository"
  > &
    Readonly<{
      content: ContentApplication
      cursorSigningSecret: string
      database: WritingAppDatabase
      presentationSecret: string
    }>
): LearningModule {
  const content = createLearningContentQueryPort(input.content)
  const transitionRepository = createDrizzleLearnerTransitionRepository(
    input.database
  )
  const readRepository = createDrizzleLearningReadRepository(input.database, {
    content,
    presentationSecret: input.presentationSecret,
  })
  const application = createLearningApplication({
    ...input,
    content,
    readRepository,
    transitionRepository,
  })
  const cursor = createLearnerCursorCodec(input.cursorSigningSecret)
  const reportingQuery = createLearningReportingQuery({
    content,
    repository: createDrizzleLearningReportingRepository(input.database),
  })
  const profileStatsQuery = createLearningProfileStatsQuery({
    reporting: reportingQuery,
  })

  return {
    aiFeedbackCommand: createAiFeedbackHttpCommand(application),
    application,
    cursor,
    profileStatsQuery: {
      readProfileStats(userId: string) {
        return profileStatsQuery.readProfileStats(toLearningUserId(userId))
      },
    },
    reportingQuery,
  }
}

export { learningLearnerDataPurge } from "#learning/infrastructure/persistence/learner-purge"

function createAiFeedbackHttpCommand(
  application: LearningApplication
): LearningAiFeedbackHttpCommandPort {
  return {
    async requestFeedback(command, options) {
      const result = await application.requestAiFeedback(command, options)
      return result.isErr()
        ? err(mapAiFeedbackHttpError(result.error))
        : ok(presentAiFeedbackResult(result.value))
    },
  }
}

function mapAiFeedbackHttpError(
  error: LearningCommandError
): LearningAiFeedbackHttpCommandError {
  switch (error.kind) {
    case "invalid-request":
    case "lesson-not-found":
    case "lesson-locked":
    case "curriculum-version-changed":
    case "step-sequence-conflict":
    case "feedback-answer-not-found":
    case "feedback-target-invalid":
    case "attempt-limit-exceeded":
    case "attempt-in-progress":
    case "daily-quota-exceeded":
    case "provider-response-invalid":
    case "provider-timeout":
    case "provider-unavailable":
    case "request-aborted":
      return error
    case "learner-inactive":
    case "learner-not-found":
    case "step-draft-version-conflict":
      return { kind: "invalid-request" }
    case "identity-query-failed":
    case "persistence-failed":
      return { kind: "persistence-failed" }
  }

  return assertExhaustiveHttpResult(error)
}
