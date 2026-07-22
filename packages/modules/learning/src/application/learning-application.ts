import { err, ok, type Result } from "@workspace/kernel/result"
import type {
  CurriculumVersionId,
  LearnerId,
  LessonId,
  LessonStepId,
} from "@workspace/types/ids"

import type {
  CompleteLearnerStepTransitionResult,
  LearnerTransitionError,
  StartLearnerLessonResult,
} from "#learning/domain/learner-transition"
import type { LearnerStepSubmission } from "#learning/domain/learning-types"
import type {
  CommittedLearningTransition,
  LearningAiFeedbackError,
  LearningAiFeedbackResult,
  LearningApplicationDependencies,
} from "#learning/application/ports/learning-ports"

export type StartLearningLessonCommand = Readonly<{
  expectedCurriculumVersionId: CurriculumVersionId
  learnerId: LearnerId
  lessonId: LessonId
}>

export type AnswerLearningStepCommand = Readonly<{
  learnerId: LearnerId
  lessonId: LessonId
  stepId: LessonStepId
  submission: LearnerStepSubmission
}>

export type CompleteLearningStepCommand = Readonly<{
  learnerId: LearnerId
  lessonId: LessonId
  stepId: LessonStepId
}>

export type RequestLearningAiFeedbackCommand = Readonly<{
  idempotencyKey: string
  learnerId: LearnerId
  lessonId: LessonId
  stepId: LessonStepId
}>

export type LearningCollaboratorError =
  | Readonly<{ kind: "learner-inactive" }>
  | Readonly<{ kind: "learner-not-found" }>
  | Readonly<{ kind: "identity-query-failed" }>

export type LearningCommandError =
  | LearnerTransitionError
  | LearningCollaboratorError
  | LearningAiFeedbackError

export type LearningAiFeedbackTransition = Readonly<{
  feedback: LearningAiFeedbackResult
  transition: CompleteLearnerStepTransitionResult
}>

export type LearningApplication = Readonly<{
  answerStep: (
    command: AnswerLearningStepCommand
  ) => Promise<
    Result<CompleteLearnerStepTransitionResult, LearningCommandError>
  >
  completeStep: (
    command: CompleteLearningStepCommand
  ) => Promise<
    Result<CompleteLearnerStepTransitionResult, LearningCommandError>
  >
  requestAiFeedback: (
    command: RequestLearningAiFeedbackCommand,
    options?: Readonly<{ signal?: AbortSignal }>
  ) => Promise<Result<LearningAiFeedbackTransition, LearningCommandError>>
  startLesson: (
    command: StartLearningLessonCommand
  ) => Promise<Result<StartLearnerLessonResult, LearningCommandError>>
}>

export function createLearningApplication(
  dependencies: LearningApplicationDependencies
): LearningApplication {
  async function complete(
    command: AnswerLearningStepCommand | CompleteLearningStepCommand
  ): Promise<
    Result<CompleteLearnerStepTransitionResult, LearningCommandError>
  > {
    const authorization = await authorizeLearner(
      dependencies,
      command.learnerId
    )
    if (authorization.isErr()) return err(authorization.error)
    const curriculum = await readLessonCurriculum(dependencies, command)
    if (curriculum === null) {
      return err({ kind: "lesson-not-found", lessonId: command.lessonId })
    }
    const committed = await dependencies.transitionRepository.completeStep(
      {
        completion:
          "submission" in command
            ? { kind: "answer", submission: command.submission }
            : { kind: "acknowledge" },
        lessonId: command.lessonId,
        occurredAt: dependencies.clock.now(),
        stepId: command.stepId,
        userId: command.learnerId,
      },
      curriculum
    )
    if (committed.isErr()) return err(committed.error)
    await publishCommittedEvents(dependencies, committed.value)
    return ok(committed.value.value)
  }

  return Object.freeze({
    answerStep: complete,
    completeStep: complete,
    async requestAiFeedback(command, options) {
      const authorization = await authorizeLearner(
        dependencies,
        command.learnerId
      )
      if (authorization.isErr()) return err(authorization.error)
      const curriculum = await readLessonCurriculum(dependencies, command)
      if (curriculum === null) {
        return err({ kind: "lesson-not-found", lessonId: command.lessonId })
      }
      const prepared =
        await dependencies.transitionRepository.prepareAiFeedback(
          {
            lessonId: command.lessonId,
            stepId: command.stepId,
            userId: command.learnerId,
          },
          curriculum
        )
      if (prepared.isErr()) return err(prepared.error)

      const feedback = await dependencies.aiFeedback.requestFeedback(
        {
          ...prepared.value,
          idempotencyKey: command.idempotencyKey,
          learnerId: command.learnerId,
          lessonId: command.lessonId,
          stepId: command.stepId,
        },
        options ?? {}
      )
      if (feedback.isErr()) return err(feedback.error)

      const committed =
        await dependencies.transitionRepository.completeAiFeedbackStep(
          {
            lessonId: command.lessonId,
            occurredAt: dependencies.clock.now(),
            stepId: command.stepId,
            userId: command.learnerId,
          },
          curriculum
        )
      if (committed.isErr()) return err(committed.error)
      await publishCommittedEvents(dependencies, committed.value)
      return ok({ feedback: feedback.value, transition: committed.value.value })
    },
    async startLesson(command) {
      const authorization = await authorizeLearner(
        dependencies,
        command.learnerId
      )
      if (authorization.isErr()) return err(authorization.error)
      const curriculum = await readLessonCurriculum(dependencies, command)
      if (curriculum === null) {
        return err({ kind: "lesson-not-found", lessonId: command.lessonId })
      }
      const committed = await dependencies.transitionRepository.startLesson(
        {
          expectedCurriculumVersionId: command.expectedCurriculumVersionId,
          lessonId: command.lessonId,
          occurredAt: dependencies.clock.now(),
          userId: command.learnerId,
        },
        curriculum
      )
      if (committed.isErr()) return err(committed.error)
      await publishCommittedEvents(dependencies, committed.value)
      return ok(committed.value.value)
    },
  })
}

async function authorizeLearner(
  dependencies: LearningApplicationDependencies,
  learnerId: LearnerId
): Promise<Result<void, LearningCollaboratorError>> {
  const status = await dependencies.identity.readLearnerStatus(learnerId)
  if (status.isErr()) {
    return err(
      status.error.kind === "identity-not-found"
        ? { kind: "learner-not-found" }
        : { kind: "identity-query-failed" }
    )
  }
  return status.value === "active"
    ? ok(undefined)
    : err({ kind: "learner-inactive" })
}

async function readLessonCurriculum(
  dependencies: LearningApplicationDependencies,
  input: Readonly<{ learnerId: LearnerId; lessonId: LessonId }>
) {
  const pinned = await dependencies.transitionRepository.findPinnedScope(input)
  return pinned === null
    ? dependencies.content.findCurriculumByLesson({ lessonId: input.lessonId })
    : dependencies.content.readCurriculum({
        courseId: pinned.courseId,
        curriculumVersionId: pinned.curriculumVersionId,
      })
}

async function publishCommittedEvents<TValue>(
  dependencies: LearningApplicationDependencies,
  committed: CommittedLearningTransition<TValue>
): Promise<void> {
  for (const intent of committed.events) {
    const eventId = dependencies.eventIdGenerator.next()
    try {
      const published =
        await dependencies.eventPublisher.publishLessonCompleted(
          Object.freeze({
            id: eventId,
            occurredAt: new Date(intent.occurredAt),
            payload: Object.freeze({
              learnerId: intent.learnerId,
              lessonId: intent.lessonId,
            }),
            type: intent.type,
          })
        )
      if (published.isErr()) {
        observeEventFailure(dependencies, eventId)
      }
    } catch {
      observeEventFailure(dependencies, eventId)
    }
  }
}

function observeEventFailure(
  dependencies: LearningApplicationDependencies,
  eventId: string
): void {
  try {
    dependencies.eventFailureObserver({
      eventId,
      eventName: "learning.lesson-completed",
      kind: "learning-event-publish-failed",
    })
  } catch {
    // 관찰자 실패는 이미 커밋된 학습 전이 결과를 변경하지 않는다.
  }
}
