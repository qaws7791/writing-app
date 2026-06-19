import type { ContentRepository } from "@workspace/core/modules/content/application/ports/content.repository"
import { lessonDtoSchema } from "@workspace/core/modules/content/domain/content.dto"
import {
  completeLessonCommandSchema,
  saveLessonProgressCommandSchema,
  saveStepAnswerCommandSchema,
  type CompleteLessonCommand,
  type SaveLessonProgressCommand,
  type SaveStepAnswerCommand,
} from "@workspace/core/modules/learning/domain/learning.dto"
import type { LearningRepository } from "@workspace/core/modules/learning/application/ports/learning.repository"
import { validateStepAnswerForLesson } from "@workspace/core/modules/learning/domain/step-answer-policy"
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

      await learningRepository.completeLesson(parsedCommand)

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

      await learningRepository.saveLessonProgress(parsedCommand)

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

      await learningRepository.saveStepAnswer(parsedCommand)

      return ok({ saved: true })
    },
  }
}

export { answerableStepTypes } from "@workspace/core/modules/learning/domain/step-answer-policy"
