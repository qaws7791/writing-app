import type { ContentRepository } from "@workspace/core/modules/content/application/ports/content.repository"
import {
  lessonDtoSchema,
  type LessonDto,
  type LessonStepDto,
} from "@workspace/core/modules/content/domain/content.dto"
import {
  completeLessonCommandSchema,
  completeLessonRecordSchema,
  saveLessonProgressCommandSchema,
  saveStepAnswerCommandSchema,
  type CompleteLessonCommand,
  type SaveLessonProgressCommand,
  type SaveStepAnswerCommand,
} from "@workspace/core/modules/learning/domain/learning.dto"
import type { LearningRepository } from "@workspace/core/modules/learning/application/ports/learning.repository"
import type { LearningAnswer } from "@workspace/core/modules/learning/domain/learning.dto"
import {
  answerableStepTypes,
  validateStepAnswerForLesson,
} from "@workspace/core/modules/learning/domain/step-answer-policy"
import { err, ok, type Result } from "@workspace/core/shared/result"

export type LearningServiceError =
  | {
      readonly kind: "lesson-not-found"
      readonly lessonId: SaveStepAnswerCommand["lessonId"]
    }
  | {
      readonly kind: "invalid-request"
      readonly reason:
        | "step-answer-invalid"
        | "step-answer-not-supported"
        | "step-answer-shape-invalid"
        | "step-not-found-in-lesson"
      readonly stepId: SaveStepAnswerCommand["stepId"]
    }
  | {
      readonly kind: "invalid-request"
      readonly lessonId: SaveStepAnswerCommand["lessonId"]
      readonly reason: "step-progress-incomplete"
    }
  | {
      readonly currentStepIndex: number
      readonly kind: "progress-conflict"
      readonly lessonId: SaveLessonProgressCommand["lessonId"]
      readonly reason: "stale-progress"
      readonly requestedStepIndex: number
    }

export type LearningMutationResult = {
  readonly saved: true
}

export type LearningService = {
  readonly completeLesson: (
    command: CompleteLessonCommand
  ) => Promise<Result<LearningMutationResult, LearningServiceError>>
  readonly saveLessonProgress: (
    command: SaveLessonProgressCommand
  ) => Promise<Result<LearningMutationResult, LearningServiceError>>
  readonly saveStepAnswer: (
    command: SaveStepAnswerCommand
  ) => Promise<Result<LearningMutationResult, LearningServiceError>>
}

export function createLearningService({
  contentRepository,
  learningRepository,
}: {
  readonly contentRepository: ContentRepository
  readonly learningRepository: LearningRepository
}): LearningService {
  return {
    async completeLesson(command) {
      const parsedCommand = completeLessonCommandSchema.parse(command)
      const lesson = await contentRepository.findLesson(parsedCommand.lessonId)

      if (lesson === null) {
        return err({
          kind: "lesson-not-found",
          lessonId: parsedCommand.lessonId,
        })
      }

      const parsedLesson = lessonDtoSchema.parse(lesson)
      const lastStepIndex = parsedLesson.steps.length - 1
      const [hasCompletedSteps, progress] = await Promise.all([
        hasCompletedLessonSteps({
          lesson: parsedLesson,
          learningRepository,
          userId: parsedCommand.userId,
        }),
        learningRepository.findLessonProgress({
          lessonId: parsedCommand.lessonId,
          userId: parsedCommand.userId,
        }),
      ])
      const hasReachedLastStep =
        progress?.status === "completed" ||
        progress?.currentStepIndex === lastStepIndex

      if (lastStepIndex < 0 || !hasCompletedSteps || !hasReachedLastStep) {
        return err({
          kind: "invalid-request",
          lessonId: parsedCommand.lessonId,
          reason: "step-progress-incomplete",
        })
      }

      await learningRepository.completeLesson(
        completeLessonRecordSchema.parse({
          ...parsedCommand,
          currentStepIndex: lastStepIndex,
        })
      )

      return ok({ saved: true })
    },
    async saveLessonProgress(command) {
      const parsedCommand = saveLessonProgressCommandSchema.parse(command)
      const lesson = await contentRepository.findLesson(parsedCommand.lessonId)

      if (lesson === null) {
        return err({
          kind: "lesson-not-found",
          lessonId: parsedCommand.lessonId,
        })
      }

      const parsedLesson = lessonDtoSchema.parse(lesson)
      const currentStep = parsedLesson.steps[parsedCommand.currentStepIndex]
      const firstStep = parsedLesson.steps[0]
      const [startAnswer, priorStepsComplete, progress] = await Promise.all([
        firstStep === undefined
          ? null
          : learningRepository.findStepAnswer({
              lessonId: parsedCommand.lessonId,
              stepId: firstStep.id,
              userId: parsedCommand.userId,
            }),
        hasCompletedAnswerableStepsBefore({
          beforeStepIndex: parsedCommand.currentStepIndex,
          lesson: parsedLesson,
          learningRepository,
          userId: parsedCommand.userId,
        }),
        learningRepository.findLessonProgress({
          lessonId: parsedCommand.lessonId,
          userId: parsedCommand.userId,
        }),
      ])
      const followsSavedProgress =
        progress === null
          ? parsedCommand.currentStepIndex === 0
          : parsedCommand.currentStepIndex === progress.currentStepIndex ||
            parsedCommand.currentStepIndex === progress.currentStepIndex + 1

      if (
        currentStep === undefined ||
        startAnswer === null ||
        !priorStepsComplete ||
        !followsSavedProgress
      ) {
        return err({
          kind: "invalid-request",
          lessonId: parsedCommand.lessonId,
          reason: "step-progress-incomplete",
        })
      }

      if (progress?.status === "completed") {
        return ok({ saved: true })
      }

      const saveResult =
        await learningRepository.saveLessonProgress(parsedCommand)

      if (saveResult.kind === "stale") {
        return err({
          currentStepIndex: saveResult.currentStepIndex,
          kind: "progress-conflict",
          lessonId: parsedCommand.lessonId,
          reason: "stale-progress",
          requestedStepIndex: parsedCommand.currentStepIndex,
        })
      }

      return ok({ saved: true })
    },
    async saveStepAnswer(command) {
      const parsedCommand = saveStepAnswerCommandSchema.parse(command)
      const lesson = await contentRepository.findLesson(parsedCommand.lessonId)

      if (lesson === null) {
        return err({
          kind: "lesson-not-found",
          lessonId: parsedCommand.lessonId,
        })
      }

      const parsedLesson = lessonDtoSchema.parse(lesson)
      const stepAnswerValidation = validateStepAnswerForLesson({
        answer: parsedCommand.answer,
        lesson: parsedLesson,
        stepId: parsedCommand.stepId,
      })

      if (stepAnswerValidation.kind === "rejected") {
        return err({
          kind: "invalid-request",
          reason: stepAnswerValidation.reason,
          stepId: stepAnswerValidation.stepId,
        })
      }

      const stepIndex = parsedLesson.steps.findIndex(
        (step) => step.id === parsedCommand.stepId
      )
      const priorStepsComplete = await hasCompletedAnswerableStepsBefore({
        beforeStepIndex: stepIndex,
        lesson: parsedLesson,
        learningRepository,
        userId: parsedCommand.userId,
      })

      if (stepIndex < 0 || !priorStepsComplete) {
        return err({
          kind: "invalid-request",
          lessonId: parsedCommand.lessonId,
          reason: "step-progress-incomplete",
        })
      }

      await learningRepository.saveStepAnswer(parsedCommand)

      return ok({ saved: true })
    },
  }
}

async function hasCompletedLessonSteps({
  lesson,
  learningRepository,
  userId,
}: {
  readonly lesson: LessonDto
  readonly learningRepository: LearningRepository
  readonly userId: SaveStepAnswerCommand["userId"]
}): Promise<boolean> {
  const firstStep = lesson.steps[0]

  if (firstStep === undefined) {
    return false
  }

  const startAnswer = await learningRepository.findStepAnswer({
    lessonId: lesson.id,
    stepId: firstStep.id,
    userId,
  })

  if (startAnswer === null) {
    return false
  }

  return hasCompletedAnswerableStepsBefore({
    beforeStepIndex: lesson.steps.length,
    lesson,
    learningRepository,
    userId,
  })
}

async function hasCompletedAnswerableStepsBefore({
  beforeStepIndex,
  lesson,
  learningRepository,
  userId,
}: {
  readonly beforeStepIndex: number
  readonly lesson: LessonDto
  readonly learningRepository: LearningRepository
  readonly userId: SaveStepAnswerCommand["userId"]
}): Promise<boolean> {
  const requiredSteps = lesson.steps
    .slice(0, beforeStepIndex)
    .filter((step) => answerableStepTypes.has(step.type))
  const savedAnswers = await Promise.all(
    requiredSteps.map((step) =>
      learningRepository.findStepAnswer({
        lessonId: lesson.id,
        stepId: step.id,
        userId,
      })
    )
  )

  return requiredSteps.every((step, index) =>
    isCompletedStepAnswer(step, savedAnswers[index] ?? null, lesson)
  )
}

function isCompletedStepAnswer(
  step: LessonStepDto,
  answer: LearningAnswer | null,
  lesson: LessonDto
): boolean {
  return (
    answer !== null &&
    "type" in answer &&
    answer.type === step.type &&
    validateStepAnswerForLesson({ answer, lesson, stepId: step.id }).kind ===
      "accepted"
  )
}

export { answerableStepTypes }
