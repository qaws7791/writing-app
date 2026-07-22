import type {
  CourseId,
  LessonId,
  LessonStepId,
} from "@workspace/contracts/content/ids"
import type {
  CurriculumVersionId,
  LearnerId,
} from "@workspace/contracts/learning/step-data"

import {
  toLearningDateKey,
  type LearningDateKey,
} from "#core/modules/learning/domain/learning-date"
import type {
  LearnerLessonScope,
  LearnerTransitionError,
  StartLearnerLessonCommand,
} from "#core/modules/learning/domain/learner-transition"

export type StartLessonSnapshot =
  | { readonly kind: "lesson-not-found" }
  | {
      readonly isUnlocked: boolean
      readonly kind: "lesson"
      readonly progress:
        | { readonly kind: "not-started" }
        | { readonly kind: "started" }
      readonly scope: LearnerLessonScope
      readonly stepIds: readonly LessonStepId[]
    }

export type StartLessonEffect =
  | {
      readonly courseId: CourseId
      readonly curriculumVersionId: CurriculumVersionId
      readonly kind: "ensure-course-started"
      readonly occurredAt: Date
      readonly userId: LearnerId
    }
  | {
      readonly courseId: CourseId
      readonly curriculumVersionId: CurriculumVersionId
      readonly firstStepId: LessonStepId
      readonly kind: "ensure-lesson-started"
      readonly lessonId: LessonId
      readonly occurredAt: Date
      readonly userId: LearnerId
    }
  | {
      readonly activityDate: LearningDateKey
      readonly courseId: CourseId
      readonly curriculumVersionId: CurriculumVersionId
      readonly kind: "record-learning-activity"
      readonly occurredAt: Date
      readonly userId: LearnerId
    }

type AcceptedStartLessonDecision = {
  readonly effects: readonly StartLessonEffect[]
  readonly scope: LearnerLessonScope
  readonly stepIds: readonly LessonStepId[]
  readonly userId: LearnerId
}

export type StartLessonDecision =
  | { readonly error: LearnerTransitionError; readonly kind: "rejected" }
  | (AcceptedStartLessonDecision & { readonly kind: "start" })
  | (AcceptedStartLessonDecision & { readonly kind: "replay" })

export function decideStartLesson(
  command: StartLearnerLessonCommand,
  snapshot: StartLessonSnapshot
): StartLessonDecision {
  if (snapshot.kind === "lesson-not-found") {
    return {
      error: { kind: "lesson-not-found", lessonId: command.lessonId },
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
  if (!snapshot.isUnlocked) {
    return {
      error: { kind: "lesson-locked", lessonId: command.lessonId },
      kind: "rejected",
    }
  }

  const firstStepId = snapshot.stepIds[0]
  if (firstStepId === undefined) {
    return {
      error: { kind: "lesson-not-found", lessonId: command.lessonId },
      kind: "rejected",
    }
  }

  return {
    effects: createStartLessonEffects(command, snapshot.scope, firstStepId),
    kind: snapshot.progress.kind === "started" ? "replay" : "start",
    scope: snapshot.scope,
    stepIds: snapshot.stepIds,
    userId: command.userId,
  }
}

function createStartLessonEffects(
  command: StartLearnerLessonCommand,
  scope: LearnerLessonScope,
  firstStepId: LessonStepId
): readonly StartLessonEffect[] {
  return [
    {
      courseId: scope.courseId,
      curriculumVersionId: scope.curriculumVersionId,
      kind: "ensure-course-started",
      occurredAt: command.occurredAt,
      userId: command.userId,
    },
    {
      courseId: scope.courseId,
      curriculumVersionId: scope.curriculumVersionId,
      firstStepId,
      kind: "ensure-lesson-started",
      lessonId: scope.lessonId,
      occurredAt: command.occurredAt,
      userId: command.userId,
    },
    {
      activityDate: toLearningDateKey(command.occurredAt),
      courseId: scope.courseId,
      curriculumVersionId: scope.curriculumVersionId,
      kind: "record-learning-activity",
      occurredAt: command.occurredAt,
      userId: command.userId,
    },
  ]
}
