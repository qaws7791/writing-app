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
} from "#learning/domain/learning-types"
import {
  toLearningDateKey,
  type LearningDateKey,
} from "#learning/domain/learning-date"
import type {
  CompleteLearnerLessonCommand,
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

export type CompleteLessonSnapshot =
  | {
      readonly kind: "lesson-scope-missing"
      readonly publishedLessonExists: boolean
    }
  | {
      readonly completedLessonIds: readonly LessonId[]
      readonly courseCompletionLessonIds: readonly LessonId[]
      readonly kind: "lesson"
      readonly progress: LessonProgressSnapshot
      readonly scope: LearnerLessonScope
      readonly steps: readonly LearningStep[]
    }

type CompleteLessonEffect =
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

type CompleteLessonPlanContext = {
  readonly aggregate: Readonly<{
    scope: LearnerLessonScope
    stepIds: readonly LessonStepId[]
    userId: LearnerId
  }>
  readonly effects: readonly CompleteLessonEffect[]
  readonly scope: LearnerLessonScope
  readonly stepIds: readonly LessonStepId[]
  readonly userId: LearnerId
}

export type CompleteLessonPlan =
  | {
      readonly error: LearnerTransitionError
      readonly kind: "rejected"
    }
  | (CompleteLessonPlanContext & {
      readonly kind: "replay-completed"
    })
  | (CompleteLessonPlanContext & {
      readonly accuracyPercent: number
      readonly durationMinutes: number
      readonly kind: "accept-lesson"
    })

export function planCompleteLesson(
  command: CompleteLearnerLessonCommand,
  snapshot: CompleteLessonSnapshot
): CompleteLessonPlan {
  if (snapshot.kind === "lesson-scope-missing") {
    return {
      error: snapshot.publishedLessonExists
        ? { kind: "lesson-locked", lessonId: command.lessonId }
        : { kind: "lesson-not-found", lessonId: command.lessonId },
      kind: "rejected",
    }
  }

  if (
    snapshot.scope.curriculumVersionId !== command.expectedCurriculumVersionId
  ) {
    return {
      error: {
        kind: "curriculum-version-changed",
        lessonId: command.lessonId,
      },
      kind: "rejected",
    }
  }

  const context = createPlanContext(command, snapshot)
  if (snapshot.progress.kind === "completed") {
    return {
      ...context,
      kind: "replay-completed",
    }
  }

  const courseEffects: readonly CompleteLessonEffect[] = shouldCompleteCourse(
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

  const finalStepId =
    snapshot.steps[snapshot.steps.length - 1]?.id ??
    command.completedStepIds[command.completedStepIds.length - 1] ??
    ("step-final" as LessonStepId)

  const accuracyPercent =
    command.totalAttempts > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((command.totalAttempts - command.mistakeCount) /
                command.totalAttempts) *
                100
            )
          )
        )
      : 100

  const durationMinutes = Math.max(1, Math.round(command.durationSeconds / 60))

  return {
    ...context,
    accuracyPercent,
    durationMinutes,
    effects: [
      {
        curriculumVersionId: snapshot.scope.curriculumVersionId,
        finalStepId,
        kind: "complete-lesson",
        lessonId: command.lessonId,
        occurredAt: command.occurredAt,
        userId: command.userId,
      },
      ...courseEffects,
      {
        activityDate: toLearningDateKey(command.occurredAt),
        completedLessons: 1,
        courseId: snapshot.scope.courseId,
        curriculumVersionId: snapshot.scope.curriculumVersionId,
        kind: "record-learning-activity",
        occurredAt: command.occurredAt,
        savedAnswers: 0,
        userId: command.userId,
      },
    ],
    kind: "accept-lesson",
  }
}

function createPlanContext(
  command: CompleteLearnerLessonCommand,
  snapshot: Extract<CompleteLessonSnapshot, { readonly kind: "lesson" }>
): CompleteLessonPlanContext {
  const aggregate = {
    scope: snapshot.scope,
    stepIds: snapshot.steps.map((step) => step.id),
    userId: command.userId,
  }
  return {
    aggregate,
    effects: [],
    ...aggregate,
  }
}

function shouldCompleteCourse(
  snapshot: Extract<CompleteLessonSnapshot, { readonly kind: "lesson" }>
): boolean {
  const remaining = snapshot.courseCompletionLessonIds.filter(
    (id) =>
      id !== snapshot.scope.lessonId &&
      !snapshot.completedLessonIds.includes(id)
  )
  return remaining.length === 0
}
