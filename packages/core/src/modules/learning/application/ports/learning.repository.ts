import type {
  CompleteLessonRecord,
  LearningAnswer,
  SaveLessonProgressCommand,
  SaveStepAnswerCommand,
} from "@workspace/core/modules/learning/domain/learning.dto"

export type LearningRepository = {
  readonly completeLesson: (record: CompleteLessonRecord) => Promise<void>
  readonly findLessonProgress: (
    query: FindLessonProgressQuery
  ) => Promise<LessonProgressRecord | null>
  readonly findStepAnswer: (
    query: FindStepAnswerQuery
  ) => Promise<LearningAnswer | null>
  readonly saveLessonProgress: (
    command: SaveLessonProgressCommand
  ) => Promise<void>
  readonly saveStepAnswer: (command: SaveStepAnswerCommand) => Promise<void>
}

export type FindLessonProgressQuery = Pick<
  SaveLessonProgressCommand,
  "lessonId" | "userId"
>

export type FindStepAnswerQuery = Pick<
  SaveStepAnswerCommand,
  "lessonId" | "stepId" | "userId"
>

export type LessonProgressRecord = Pick<
  SaveLessonProgressCommand,
  "currentStepIndex" | "lessonId" | "userId"
> & {
  readonly status: "completed" | "in_progress"
}

export type {
  CompleteLessonRecord,
  SaveLessonProgressCommand,
  SaveStepAnswerCommand,
}
