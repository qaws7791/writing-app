import type {
  CompleteLessonCommand,
  SaveLessonProgressCommand,
  SaveStepAnswerCommand,
} from "@workspace/core/learning/learning.dto"

export type LearningRepository = {
  readonly completeLesson: (command: CompleteLessonCommand) => Promise<void>
  readonly saveLessonProgress: (
    command: SaveLessonProgressCommand
  ) => Promise<void>
  readonly saveStepAnswer: (command: SaveStepAnswerCommand) => Promise<void>
}

export type {
  CompleteLessonCommand,
  SaveLessonProgressCommand,
  SaveStepAnswerCommand,
}
