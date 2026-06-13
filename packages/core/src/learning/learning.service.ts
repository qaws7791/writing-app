import type { ContentRepository, LessonStepType } from "@workspace/core/content"
import { lessonDtoSchema } from "@workspace/core/content"
import {
  completeLessonCommandSchema,
  saveLessonProgressCommandSchema,
  saveStepAnswerCommandSchema,
  type CompleteLessonCommand,
  type SaveLessonProgressCommand,
  type SaveStepAnswerCommand,
} from "@workspace/core/learning/learning.dto"
import type { LearningRepository } from "@workspace/core/learning/learning.repository"
import { err, ok, type Result } from "@workspace/core/result"

const answerableStepTypes = new Set<LessonStepType>([
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "SELECT",
  "ORDER",
  "MATCH",
  "CATEGORIZE",
  "WRITE",
  "AI_FEEDBACK",
])

export type LearningServiceError =
  | {
      readonly kind: "lesson-not-found"
      readonly lessonId: SaveStepAnswerCommand["lessonId"]
    }
  | {
      readonly kind: "invalid-request"
      readonly reason: "step-answer-not-supported" | "step-not-found-in-lesson"
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
      const step = parsedLesson.steps.find(
        (candidate) => candidate.id === parsedCommand.stepId
      )

      if (step === undefined) {
        return err({
          kind: "invalid-request",
          reason: "step-not-found-in-lesson",
          stepId: parsedCommand.stepId,
        })
      }

      const supportsStepAnswer =
        answerableStepTypes.has(step.type) ||
        isLessonStartedAnswer(parsedCommand.answer, {
          firstStepId: parsedLesson.steps[0]?.id,
          stepId: step.id,
        })

      if (!supportsStepAnswer) {
        return err({
          kind: "invalid-request",
          reason: "step-answer-not-supported",
          stepId: parsedCommand.stepId,
        })
      }

      await learningRepository.saveStepAnswer(parsedCommand)

      return ok({ saved: true })
    },
  }
}

export { answerableStepTypes }

function isLessonStartedAnswer(
  answer: unknown,
  {
    firstStepId,
    stepId,
  }: {
    readonly firstStepId: string | undefined
    readonly stepId: string
  }
): boolean {
  return (
    stepId === firstStepId &&
    typeof answer === "object" &&
    answer !== null &&
    "kind" in answer &&
    answer.kind === "lesson-started"
  )
}
