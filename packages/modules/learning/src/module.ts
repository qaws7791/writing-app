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
  createLearningQueries,
  type LearningQueries,
} from "#learning/application/learning-queries"
import {
  createLearningProfileStatsQuery,
  createLearningReportingQuery,
  type LearningProfileStats,
  type LearningReportingQuery,
} from "#learning/application/learning-reporting"
import type { LearningApplicationDependencies } from "#learning/application/ports/learning-ports"
import { createDrizzleLearningReadRepository } from "#learning/infrastructure/persistence/learning-read-drizzle-repository"
import { createLearnerCursorCodec } from "#learning/infrastructure/persistence/learner-cursor"
import {
  createDrizzleLearningReportingRepository,
  toLearningUserId,
} from "#learning/infrastructure/persistence/learning-reporting-drizzle-repository"
import { createDrizzleLearnerTransitionRepository } from "#learning/infrastructure/persistence/learning-transition-drizzle-repository"
import {
  createLearningRoutes,
  type LearningHttpRouteGroup,
  type LearningLearnerSessionPort,
} from "#learning/interface/http/learning-routes"
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
  createLearnerRoutes: (
    session: LearningLearnerSessionPort
  ) => LearningHttpRouteGroup
  profileStatsQuery: Readonly<{
    readProfileStats: (userId: string) => Promise<LearningProfileStats>
  }>
  queries: LearningQueries
  reportingQuery: LearningReportingQuery
}>

export function createLearningModule(
  input: Omit<LearningApplicationDependencies, "transitionRepository"> &
    Readonly<{
      cursorSigningSecret: string
      database: WritingAppDatabase
      presentationSecret: string
    }>
): LearningModule {
  const transitionRepository = createDrizzleLearnerTransitionRepository(
    input.database
  )
  const application = createLearningApplication({
    ...input,
    transitionRepository,
  })
  const readRepository = createDrizzleLearningReadRepository(input.database, {
    content: input.content,
    presentationSecret: input.presentationSecret,
  })
  const queries = createLearningQueries(readRepository)
  const cursor = createLearnerCursorCodec(input.cursorSigningSecret)
  const reportingQuery = createLearningReportingQuery({
    content: input.content,
    repository: createDrizzleLearningReportingRepository(input.database),
  })
  const profileStatsQuery = createLearningProfileStatsQuery({
    reporting: reportingQuery,
  })

  return Object.freeze({
    aiFeedbackCommand: createAiFeedbackHttpCommand(application),
    application,
    createLearnerRoutes(session) {
      return createLearningRoutes({ application, cursor, queries, session })
    },
    profileStatsQuery: Object.freeze({
      readProfileStats(userId: string) {
        return profileStatsQuery.readProfileStats(toLearningUserId(userId))
      },
    }),
    queries,
    reportingQuery,
  })
}

function createAiFeedbackHttpCommand(
  application: LearningApplication
): LearningAiFeedbackHttpCommandPort {
  return Object.freeze({
    async requestFeedback(command, options) {
      const result = await application.requestAiFeedback(command, options)
      return result.isErr()
        ? err(mapAiFeedbackHttpError(result.error))
        : ok(presentAiFeedbackResult(result.value))
    },
  })
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
    case "provider-response-invalid":
    case "provider-timeout":
    case "provider-unavailable":
    case "request-aborted":
      return error
    case "learner-inactive":
    case "learner-not-found":
      return { kind: "invalid-request" }
    case "identity-query-failed":
    case "persistence-failed":
      return { kind: "persistence-failed" }
  }

  return assertExhaustiveHttpResult(error)
}
