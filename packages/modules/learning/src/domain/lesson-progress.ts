import type { LearnerId, LessonId, LessonStepId } from "@workspace/types/ids"

import type { LearnerStepSubmission } from "#learning/domain/learning-types"

export type LessonProgress =
  | Readonly<{ kind: "not-started" }>
  | Readonly<{ currentStepId: LessonStepId; kind: "in-progress" }>
  | Readonly<{ currentStepId: LessonStepId; kind: "completed" }>

type LessonSubmission = LearnerStepSubmission

export type LearningAttempt = Readonly<{
  learnerId: LearnerId
  lessonId: LessonId
  occurredAt: Date
  stepId: LessonStepId
  submission: LessonSubmission
}>

export function createLearningAttempt(input: LearningAttempt): LearningAttempt {
  return Object.freeze({
    ...input,
    submission: freezeSubmission(input.submission),
  })
}

export function createLessonProgress(input: LessonProgress): LessonProgress {
  return Object.freeze({ ...input })
}

function freezeSubmission(submission: LessonSubmission): LessonSubmission {
  switch (submission.type) {
    case "MULTIPLE_CHOICE":
    case "WRITE":
      return Object.freeze({ ...submission })
    case "FILL_BLANK":
      return Object.freeze({
        ...submission,
        selectedChoiceIds: Object.freeze([...submission.selectedChoiceIds]),
      })
    case "SELECT":
      return Object.freeze({
        ...submission,
        selectedItemIds: Object.freeze([...submission.selectedItemIds]),
      })
    case "ORDER":
      return Object.freeze({
        ...submission,
        orderedItemIds: Object.freeze([...submission.orderedItemIds]),
      })
    case "MATCH":
      return Object.freeze({
        ...submission,
        pairs: Object.freeze(
          submission.pairs.map((pair) => Object.freeze({ ...pair }))
        ),
      })
    case "CATEGORIZE":
      return Object.freeze({
        ...submission,
        assignments: Object.freeze(
          submission.assignments.map((assignment) =>
            Object.freeze({ ...assignment })
          )
        ),
      })
  }
}
