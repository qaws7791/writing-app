import type {
  CourseId,
  CurriculumVersionId,
  LearnerId,
  LessonId,
  LessonStepId,
} from "@workspace/types/ids"

import type {
  CourseLearningState,
  LearnerStepDraft,
  LearnerStepDraftAnswer,
  LearnerStepSubmission,
  LessonLearningState,
  StepEvaluation,
} from "#learning/domain/learning-types"
type InProgressLessonLearningState = Extract<
  LessonLearningState,
  { readonly status: "in_progress" }
>

type LessonCompletion = Extract<
  LessonLearningState,
  { readonly status: "completed" }
>["completion"]

export type LearnerLessonScope = {
  readonly courseId: CourseId
  readonly curriculumVersionId: CurriculumVersionId
  readonly lessonId: LessonId
  readonly revision: number
}

export type StartLearnerLessonCommand = {
  readonly expectedCurriculumVersionId: CurriculumVersionId
  readonly lessonId: LessonId
  readonly occurredAt: Date
  readonly userId: LearnerId
}

export type CompleteLearnerStepCommand = {
  readonly completion: LearnerStepCompletion
  readonly lessonId: LessonId
  readonly occurredAt: Date
  readonly stepId: LessonStepId
  readonly userId: LearnerId
}

export type SaveLearnerStepDraftCommand = {
  readonly answer: LearnerStepDraftAnswer
  readonly expectedCurriculumVersionId: CurriculumVersionId
  readonly expectedVersion: number | null
  readonly lessonId: LessonId
  readonly occurredAt: Date
  readonly stepId: LessonStepId
  readonly userId: LearnerId
}

export type LearnerStepCompletion =
  | { readonly kind: "acknowledge" }
  | {
      readonly acceptIncorrect?: boolean
      readonly kind: "answer"
      readonly submission: LearnerStepSubmission
    }

export type LearnerTransitionError =
  | { readonly kind: "lesson-not-found"; readonly lessonId: LessonId }
  | { readonly kind: "lesson-locked"; readonly lessonId: LessonId }
  | {
      readonly kind: "curriculum-version-changed"
      readonly lessonId: LessonId
    }
  | {
      readonly kind: "step-sequence-conflict"
      readonly lessonId: LessonId
      readonly stepId: LessonStepId
    }
  | {
      readonly currentVersion: number | null
      readonly kind: "step-draft-version-conflict"
      readonly lessonId: LessonId
      readonly stepId: LessonStepId
    }
  | {
      readonly kind: "invalid-request"
      readonly lessonId: LessonId
      readonly stepId: LessonStepId
    }

export type StartLearnerLessonResult = LessonLearningState &
  Readonly<{ drafts: readonly LearnerStepDraft[] }>
export type SaveLearnerStepDraftResult = LearnerStepDraft
export type CompleteLearnerStepTransitionResult =
  | {
      readonly evaluation: StepEvaluation
      readonly kind: "retry"
      readonly learning: InProgressLessonLearningState
    }
  | {
      readonly evaluation: StepEvaluation | null
      readonly kind: "advanced"
      readonly learning: InProgressLessonLearningState
    }
  | {
      readonly courseLearning: CourseLearningState
      readonly evaluation: StepEvaluation | null
      readonly kind: "lesson-completed"
      readonly lessonCompletion: LessonCompletion
    }
