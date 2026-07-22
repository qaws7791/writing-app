import type { Database } from "bun:sqlite"
import { createOpenAiClient } from "@workspace/ai/openai-client"
import type {
  AiFeedbackApplication,
  AiFeedbackAttemptTransition,
} from "@workspace/ai-feedback/application"
import type {
  AiFeedbackHttpCommandPort,
  AiFeedbackHttpCommandError,
  AiFeedbackHttpRouteGroup,
} from "@workspace/ai-feedback/http"
import { createAiFeedbackModule } from "@workspace/ai-feedback/module"
import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import {
  createConfiguredAiFeedbackProvider,
  type OpenAiUsageEvent,
} from "@workspace/ai-feedback/provider"
import { runAiFeedbackSchemaMigration } from "@workspace/ai-feedback/schema"
import type { LearnerAiFeedbackTransitionResult } from "@workspace/contracts/learning/learner-transition"
import { learnerIdSchema } from "@workspace/contracts/learning/ids"
import type {
  CompleteLearnerStepTransitionResult,
  LearnerTransitionError,
  LearnerTransitionRepository,
} from "@workspace/core/learning"
import type { SessionResolver } from "@workspace/identity/sessions"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { WritingAppDatabase } from "@workspace/db/client"

export type ComposedAiFeedbackModule = Readonly<{
  application: AiFeedbackApplication
  routes: AiFeedbackHttpRouteGroup
}>

export function composeAiFeedbackModule(input: {
  readonly apiKey?: string
  readonly database: WritingAppDatabase
  readonly idGenerator?: () => string
  readonly learnerTransitionRepository: Pick<
    LearnerTransitionRepository,
    "completeAiFeedbackStep" | "prepareAiFeedback"
  >
  readonly model: string
  readonly now?: () => Date
  readonly onAttemptTransition?: (event: AiFeedbackAttemptTransition) => void
  readonly onUsage?: (event: OpenAiUsageEvent) => void
  readonly provider?: AiFeedbackProvider
  readonly sessionResolver: SessionResolver
  readonly sqlite: Database
}): ComposedAiFeedbackModule {
  runAiFeedbackSchemaMigration(input.sqlite)

  const now = input.now ?? (() => new Date())
  const provider =
    input.provider ??
    createConfiguredAiFeedbackProvider({
      model: input.model,
      onUsage: input.onUsage,
      runtime: createOpenAiClient({
        apiKey: input.apiKey,
        maxRetries: 0,
        timeoutMs: 30_000,
      }),
    })
  const module = createAiFeedbackModule({
    attemptIdGenerator: {
      next: input.idGenerator ?? (() => crypto.randomUUID()),
    },
    clock: { now },
    database: input.database,
    observeAttemptTransition: input.onAttemptTransition,
    provider,
  })
  const command = createAiFeedbackLearningCommand({
    application: module.application,
    learnerTransitionRepository: input.learnerTransitionRepository,
    now,
  })

  return Object.freeze({
    application: module.application,
    routes: module.createLearnerRoutes({
      command,
      session: {
        async resolveLearner(headers) {
          const session = await input.sessionResolver.resolveSession(headers)
          if (session === null) return null
          if (session.user.status !== "active") return { kind: "inactive" }

          return {
            kind: "active",
            learnerId: learnerIdSchema.parse(session.user.id),
          }
        },
      },
    }),
  })
}

function createAiFeedbackLearningCommand(input: {
  readonly application: AiFeedbackApplication
  readonly learnerTransitionRepository: Pick<
    LearnerTransitionRepository,
    "completeAiFeedbackStep" | "prepareAiFeedback"
  >
  readonly now: () => Date
}) {
  return Object.freeze({
    async requestFeedback(
      command: Parameters<AiFeedbackHttpCommandPort["requestFeedback"]>[0],
      options: Parameters<AiFeedbackHttpCommandPort["requestFeedback"]>[1]
    ): Promise<
      Result<LearnerAiFeedbackTransitionResult, AiFeedbackHttpCommandError>
    > {
      const prepared =
        await input.learnerTransitionRepository.prepareAiFeedback({
          lessonId: command.lessonId,
          stepId: command.stepId,
          userId: command.learnerId,
        })
      if (prepared.isErr()) return err(toHttpError(prepared.error))

      const requested = await input.application.requestFeedback(
        {
          answer: prepared.value.answer,
          courseId: prepared.value.courseId,
          curriculumVersionId: prepared.value.curriculumVersionId,
          focus: prepared.value.focus,
          idempotencyKey: command.idempotencyKey,
          learnerId: command.learnerId,
          lessonId: command.lessonId,
          lessonTitle: prepared.value.lessonTitle,
          showScore: prepared.value.showScore,
          stepId: command.stepId,
        },
        options
      )
      if (requested.isErr()) return err(requested.error)

      const transitioned =
        await input.learnerTransitionRepository.completeAiFeedbackStep({
          lessonId: command.lessonId,
          occurredAt: input.now(),
          stepId: command.stepId,
          userId: command.learnerId,
        })
      if (transitioned.isErr()) return err(toHttpError(transitioned.error))

      return ok({
        feedback: {
          ...requested.value,
          improvements: [...requested.value.improvements],
          scoreRange: [0, 100],
          strengths: [...requested.value.strengths],
        },
        transition: toCompleteStepResponse(transitioned.value),
      })
    },
  })
}

function toHttpError(
  error: LearnerTransitionError
): AiFeedbackHttpCommandError {
  switch (error.kind) {
    case "invalid-request":
    case "lesson-not-found":
    case "lesson-locked":
    case "curriculum-version-changed":
    case "step-sequence-conflict":
    case "feedback-answer-not-found":
    case "feedback-target-invalid":
      return { kind: error.kind }
  }
}

function toCompleteStepResponse(
  result: CompleteLearnerStepTransitionResult
): LearnerAiFeedbackTransitionResult["transition"] {
  switch (result.kind) {
    case "retry":
      return {
        evaluation: result.evaluation,
        learning: result.learning,
        status: "retry",
      }
    case "advanced":
      return {
        evaluation: result.evaluation,
        learning: result.learning,
        status: "advanced",
      }
    case "lesson-completed":
      return {
        courseLearning: result.courseLearning,
        evaluation: result.evaluation,
        lessonCompletion: result.lessonCompletion,
        status: "lesson_completed",
      }
  }
}
