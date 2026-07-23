import type {
  CourseId,
  CurriculumVersionId,
  LearnerId,
  LessonId,
  LessonStepId,
} from "@workspace/types/ids"
import type {
  LearnerStepSubmission,
  LearningStep,
  StepEvaluation,
} from "#learning/domain/learning-types"

import {
  toLearningDateKey,
  type LearningDateKey,
} from "#learning/domain/learning-date"
import { gradeLearnerStep } from "#learning/domain/step-grading-policy"
import { createLearningAttempt } from "#learning/domain/lesson-progress"
import type {
  CompleteLearnerStepCommand,
  LearnerLessonScope,
  LearnerTransitionError,
} from "#learning/domain/learner-transition"

type LessonProgressSnapshot =
  | { readonly kind: "not-started" }
  | {
      readonly currentStepId: LessonStepId
      readonly kind: "in-progress"
    }
  | { readonly kind: "completed" }

export type CompleteStepSnapshot =
  | {
      readonly kind: "lesson-scope-missing"
      readonly publishedLessonExists: boolean
    }
  | {
      readonly completedLessonIds: readonly LessonId[]
      readonly courseCompletionLessonIds: readonly LessonId[]
      readonly hasSavedAnswer: boolean
      readonly kind: "lesson"
      readonly orderedLessonIds: readonly LessonId[]
      readonly progress: LessonProgressSnapshot
      readonly scope: LearnerLessonScope
      readonly steps: readonly LearningStep[]
    }

export type CompleteStepEffect =
  | {
      readonly answer: LearnerStepSubmission
      readonly courseId: CourseId
      readonly curriculumVersionId: CurriculumVersionId
      readonly kind: "save-accepted-answer"
      readonly lessonId: LessonId
      readonly occurredAt: Date
      readonly stepId: LessonStepId
      readonly userId: LearnerId
    }
  | {
      readonly curriculumVersionId: CurriculumVersionId
      readonly fromStepId: LessonStepId
      readonly kind: "advance-lesson-step"
      readonly lessonId: LessonId
      readonly nextStepId: LessonStepId
      readonly occurredAt: Date
      readonly userId: LearnerId
    }
  | {
      readonly curriculumVersionId: CurriculumVersionId
      readonly finalStepId: LessonStepId
      readonly kind: "complete-lesson"
      readonly lessonId: LessonId
      readonly occurredAt: Date
      readonly userId: LearnerId
    }
  | {
      readonly courseId: CourseId
      readonly curriculumVersionId: CurriculumVersionId
      readonly kind: "complete-course"
      readonly occurredAt: Date
      readonly userId: LearnerId
    }
  | {
      readonly activityDate: LearningDateKey
      readonly completedLessons: 0 | 1
      readonly courseId: CourseId
      readonly curriculumVersionId: CurriculumVersionId
      readonly kind: "record-learning-activity"
      readonly occurredAt: Date
      readonly savedAnswers: 0 | 1
      readonly userId: LearnerId
    }

type CompleteStepPlanContext = {
  readonly aggregate: Readonly<{
    scope: LearnerLessonScope
    stepIds: readonly LessonStepId[]
    userId: LearnerId
  }>
  readonly effects: readonly CompleteStepEffect[]
  readonly scope: LearnerLessonScope
  readonly stepIds: readonly LessonStepId[]
  readonly userId: LearnerId
}

export type CompleteStepPlan =
  | { readonly error: LearnerTransitionError; readonly kind: "rejected" }
  | (CompleteStepPlanContext & {
      readonly evaluation: StepEvaluation
      readonly kind: "retry"
    })
  | (CompleteStepPlanContext & {
      readonly evaluation: null
      readonly kind: "replay-advanced"
    })
  | (CompleteStepPlanContext & {
      readonly evaluation: null
      readonly kind: "replay-completed"
    })
  | (CompleteStepPlanContext & {
      readonly evaluation: StepEvaluation | null
      readonly kind: "accept-step"
    })
  | (CompleteStepPlanContext & {
      readonly evaluation: StepEvaluation | null
      readonly kind: "accept-lesson"
    })

export function planCompleteStep(
  command: CompleteLearnerStepCommand,
  snapshot: CompleteStepSnapshot
): CompleteStepPlan {
  return freezeCompleteStepPlan(createCompleteStepPlan(command, snapshot))
}

function createCompleteStepPlan(
  command: CompleteLearnerStepCommand,
  snapshot: CompleteStepSnapshot
): CompleteStepPlan {
  if (snapshot.kind === "lesson-scope-missing") {
    return reject(
      snapshot.publishedLessonExists ? "lesson-locked" : "lesson-not-found",
      command
    )
  }
  if (!isLessonUnlocked(snapshot)) {
    return reject("lesson-locked", command)
  }

  const requestedStepIndex = snapshot.steps.findIndex(
    (step) => step.id === command.stepId
  )
  if (requestedStepIndex < 0) {
    return reject("step-sequence-conflict", command)
  }
  if (snapshot.progress.kind === "not-started") {
    return reject("step-sequence-conflict", command)
  }

  const context = createPlanContext(command, snapshot)
  if (snapshot.progress.kind === "completed") {
    return { ...context, evaluation: null, kind: "replay-completed" }
  }

  const currentStepId = snapshot.progress.currentStepId
  const currentStepIndex = snapshot.steps.findIndex(
    (step) => step.id === currentStepId
  )
  if (requestedStepIndex < currentStepIndex) {
    return { ...context, evaluation: null, kind: "replay-advanced" }
  }
  if (requestedStepIndex !== currentStepIndex) {
    return reject("step-sequence-conflict", command)
  }

  const step = snapshot.steps[requestedStepIndex]
  if (step === undefined) return reject("step-sequence-conflict", command)
  const grading = gradeLearnerStep(step, command.completion)
  if (grading.kind === "invalid") return reject("invalid-request", command)
  if (grading.kind === "retry") {
    return {
      ...context,
      evaluation: grading.evaluation,
      kind: "retry",
    }
  }

  const acceptedAnswer =
    grading.answer === null
      ? null
      : createLearningAttempt({
          learnerId: command.userId,
          lessonId: command.lessonId,
          occurredAt: command.occurredAt,
          stepId: command.stepId,
          submission: grading.answer,
        }).submission
  const answerEffects = createAnswerEffects(command, snapshot, acceptedAnswer)
  const answerWasSaved = answerEffects.length > 0
  const nextStep = snapshot.steps[requestedStepIndex + 1]
  if (nextStep !== undefined) {
    return {
      ...context,
      effects: [
        ...answerEffects,
        {
          curriculumVersionId: snapshot.scope.curriculumVersionId,
          fromStepId: command.stepId,
          kind: "advance-lesson-step",
          lessonId: command.lessonId,
          nextStepId: nextStep.id,
          occurredAt: command.occurredAt,
          userId: command.userId,
        },
        createActivityEffect(command, snapshot.scope, {
          answerWasSaved,
          lessonWasCompleted: false,
        }),
      ],
      evaluation: grading.evaluation,
      kind: "accept-step",
    }
  }

  const courseEffects: readonly CompleteStepEffect[] = shouldCompleteCourse(
    snapshot
  )
    ? [
        {
          courseId: snapshot.scope.courseId,
          curriculumVersionId: snapshot.scope.curriculumVersionId,
          kind: "complete-course",
          occurredAt: command.occurredAt,
          userId: command.userId,
        },
      ]
    : []
  return {
    ...context,
    effects: [
      ...answerEffects,
      {
        curriculumVersionId: snapshot.scope.curriculumVersionId,
        finalStepId: command.stepId,
        kind: "complete-lesson",
        lessonId: command.lessonId,
        occurredAt: command.occurredAt,
        userId: command.userId,
      },
      ...courseEffects,
      createActivityEffect(command, snapshot.scope, {
        answerWasSaved,
        lessonWasCompleted: true,
      }),
    ],
    evaluation: grading.evaluation,
    kind: "accept-lesson",
  }
}

function freezeCompleteStepPlan(plan: CompleteStepPlan): CompleteStepPlan {
  if (plan.kind === "rejected") {
    return Object.freeze({ ...plan, error: Object.freeze({ ...plan.error }) })
  }
  return Object.freeze({
    ...plan,
    aggregate: Object.freeze({
      ...plan.aggregate,
      scope: Object.freeze({ ...plan.aggregate.scope }),
      stepIds: Object.freeze([...plan.aggregate.stepIds]),
    }),
    effects: Object.freeze(
      plan.effects.map((effect) => Object.freeze({ ...effect }))
    ),
    scope: Object.freeze({ ...plan.scope }),
    stepIds: Object.freeze([...plan.stepIds]),
  })
}

function createPlanContext(
  command: CompleteLearnerStepCommand,
  snapshot: Extract<CompleteStepSnapshot, { readonly kind: "lesson" }>
): CompleteStepPlanContext {
  const aggregate = Object.freeze({
    scope: snapshot.scope,
    stepIds: snapshot.steps.map((step) => step.id),
    userId: command.userId,
  })
  return {
    aggregate,
    effects: [],
    ...aggregate,
  }
}

function createAnswerEffects(
  command: CompleteLearnerStepCommand,
  snapshot: Extract<CompleteStepSnapshot, { readonly kind: "lesson" }>,
  answer: LearnerStepSubmission | null
): readonly CompleteStepEffect[] {
  return answer === null || snapshot.hasSavedAnswer
    ? []
    : [
        {
          answer,
          courseId: snapshot.scope.courseId,
          curriculumVersionId: snapshot.scope.curriculumVersionId,
          kind: "save-accepted-answer",
          lessonId: command.lessonId,
          occurredAt: command.occurredAt,
          stepId: command.stepId,
          userId: command.userId,
        },
      ]
}

function createActivityEffect(
  command: CompleteLearnerStepCommand,
  scope: LearnerLessonScope,
  input: {
    readonly answerWasSaved: boolean
    readonly lessonWasCompleted: boolean
  }
): CompleteStepEffect {
  return {
    activityDate: toLearningDateKey(command.occurredAt),
    completedLessons: input.lessonWasCompleted ? 1 : 0,
    courseId: scope.courseId,
    curriculumVersionId: scope.curriculumVersionId,
    kind: "record-learning-activity",
    occurredAt: command.occurredAt,
    savedAnswers: input.answerWasSaved ? 1 : 0,
    userId: command.userId,
  }
}

function isLessonUnlocked(
  snapshot: Extract<CompleteStepSnapshot, { readonly kind: "lesson" }>
): boolean {
  const lessonIndex = snapshot.orderedLessonIds.indexOf(snapshot.scope.lessonId)
  if (lessonIndex < 0) return false
  const completedLessonIds = new Set(snapshot.completedLessonIds)
  return snapshot.orderedLessonIds
    .slice(0, lessonIndex)
    .every((lessonId) => completedLessonIds.has(lessonId))
}

function shouldCompleteCourse(
  snapshot: Extract<CompleteStepSnapshot, { readonly kind: "lesson" }>
): boolean {
  const completedLessonIds = new Set(snapshot.completedLessonIds)
  return snapshot.courseCompletionLessonIds.every(
    (lessonId) =>
      lessonId === snapshot.scope.lessonId || completedLessonIds.has(lessonId)
  )
}

function reject(
  kind:
    | "invalid-request"
    | "lesson-locked"
    | "lesson-not-found"
    | "step-sequence-conflict",
  command: CompleteLearnerStepCommand
): CompleteStepPlan {
  return kind === "lesson-locked" || kind === "lesson-not-found"
    ? { error: { kind, lessonId: command.lessonId }, kind: "rejected" }
    : {
        error: { kind, lessonId: command.lessonId, stepId: command.stepId },
        kind: "rejected",
      }
}
