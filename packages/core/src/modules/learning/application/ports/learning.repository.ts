import type {
  CompleteLessonRecord,
  LearningAnswer,
  SaveLessonProgressCommand,
  SaveStepAnswerCommand,
} from "#core/modules/learning/domain/learning.dto"

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
  ) => Promise<SaveLessonProgressResult>
  readonly saveStepAnswer: (command: SaveStepAnswerCommand) => Promise<void>
}

export type SaveLessonProgressResult =
  | {
      readonly currentStepIndex: number
      readonly kind: "saved"
      readonly status: "in_progress"
    }
  | {
      readonly currentStepIndex: number
      readonly kind: "stale"
      readonly status: "in_progress"
    }
  | {
      readonly currentStepIndex: number
      readonly kind: "completed"
      readonly status: "completed"
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
