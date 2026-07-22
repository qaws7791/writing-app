import type {
  CourseId,
  LessonId,
  LessonStepId,
} from "@workspace/contracts/content/ids"
import type {
  CourseLearningState,
  CurriculumVersionId,
  LearnerId,
  LearnerStepSubmission,
  LessonLearningState,
  StepEvaluation,
} from "@workspace/contracts/learning/step-data"
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

export type LearnerStepCompletion =
  | { readonly kind: "acknowledge" }
  | {
      readonly kind: "answer"
      readonly submission: LearnerStepSubmission
    }

export type CompleteLearnerAiFeedbackCommand = {
  readonly lessonId: LessonId
  readonly occurredAt: Date
  readonly stepId: LessonStepId
  readonly userId: LearnerId
}

export type PrepareLearnerAiFeedbackCommand = Pick<
  CompleteLearnerAiFeedbackCommand,
  "lessonId" | "stepId" | "userId"
>

export type LearnerAiFeedbackContext = {
  readonly answer: string
  readonly courseId: CourseId
  readonly curriculumVersionId: CurriculumVersionId
  readonly focus: string
  readonly lessonTitle: string
  readonly showScore: boolean
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
      readonly kind: "invalid-request"
      readonly lessonId: LessonId
      readonly stepId: LessonStepId
    }
  | {
      readonly kind: "feedback-answer-not-found"
      readonly targetStepId: LessonStepId
    }
  | {
      readonly kind: "feedback-target-invalid"
      readonly reason:
        | "target-step-not-before-feedback"
        | "target-step-not-found"
        | "target-step-not-write"
      readonly stepId: LessonStepId
    }

export type StartLearnerLessonResult = LessonLearningState
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
