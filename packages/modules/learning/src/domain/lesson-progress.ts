import type { LearnerId, LessonId, LessonStepId } from "@workspace/types/ids"

import type { LearnerStepSubmission } from "#learning/domain/learning-types"

type LessonSubmission = LearnerStepSubmission

export type LearningAttempt = Readonly<{
  learnerId: LearnerId
  lessonId: LessonId
  occurredAt: Date
  stepId: LessonStepId
  submission: LessonSubmission
}>

export function createLearningAttempt(input: LearningAttempt): LearningAttempt {
  return {
    ...input,
    submission: cloneSubmission(input.submission),
  }
}

function cloneSubmission(submission: LessonSubmission): LessonSubmission {
  switch (submission.type) {
    case "MULTIPLE_CHOICE":
      return { ...submission }
    case "FILL_BLANK":
      return {
        ...submission,
        selectedChoiceIds: [...submission.selectedChoiceIds],
      }
    case "SELECT":
      return {
        ...submission,
        selectedItemIds: [...submission.selectedItemIds],
      }
    case "ORDER":
      return {
        ...submission,
        orderedItemIds: [...submission.orderedItemIds],
      }
    case "MATCH":
      return {
        ...submission,
        pairs: submission.pairs.map((pair) => ({ ...pair })),
      }
    case "CATEGORIZE":
      return {
        ...submission,
        assignments: submission.assignments.map((assignment) => ({
          ...assignment,
        })),
      }
    case "TRUE_FALSE":
      return { ...submission }
    case "SENTENCE_BUILD":
      return {
        ...submission,
        selectedTileIds: [...submission.selectedTileIds],
      }
    case "ERROR_CORRECT":
      return { ...submission }
  }
}
