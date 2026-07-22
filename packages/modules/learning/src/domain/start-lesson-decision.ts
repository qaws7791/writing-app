import type {
  CourseId,
  CurriculumVersionId,
  LearnerId,
  LessonId,
  LessonStepId,
} from "@workspace/types/ids"
import type { DomainDecision } from "@workspace/kernel/domain-event"

import {
  toLearningDateKey,
  type LearningDateKey,
} from "#learning/domain/learning-date"
import type {
  LearnerLessonScope,
  LearnerTransitionError,
  StartLearnerLessonCommand,
} from "#learning/domain/learner-transition"

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

type StartLessonAggregate = Readonly<{
  scope: LearnerLessonScope
  stepIds: readonly LessonStepId[]
  userId: LearnerId
}>

export type StartLessonDecision =
  | { readonly error: LearnerTransitionError; readonly kind: "rejected" }
  | (AcceptedStartLessonDecision &
      DomainDecision<StartLessonAggregate, never> & { readonly kind: "start" })
  | (AcceptedStartLessonDecision &
      DomainDecision<StartLessonAggregate, never> & { readonly kind: "replay" })

export function decideStartLesson(
  command: StartLearnerLessonCommand,
  snapshot: StartLessonSnapshot
): StartLessonDecision {
  return freezeStartLessonDecision(createStartLessonDecision(command, snapshot))
}

function createStartLessonDecision(
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

  const aggregate = Object.freeze({
    scope: snapshot.scope,
    stepIds: snapshot.stepIds,
    userId: command.userId,
  })
  return {
    aggregate,
    effects: createStartLessonEffects(command, snapshot.scope, firstStepId),
    events: [],
    kind: snapshot.progress.kind === "started" ? "replay" : "start",
    ...aggregate,
  }
}

function freezeStartLessonDecision(
  decision: StartLessonDecision
): StartLessonDecision {
  if (decision.kind === "rejected") {
    return Object.freeze({
      ...decision,
      error: Object.freeze({ ...decision.error }),
    })
  }
  return Object.freeze({
    ...decision,
    aggregate: Object.freeze({
      ...decision.aggregate,
      scope: Object.freeze({ ...decision.aggregate.scope }),
      stepIds: Object.freeze([...decision.aggregate.stepIds]),
    }),
    effects: Object.freeze(
      decision.effects.map((effect) => Object.freeze({ ...effect }))
    ),
    events: Object.freeze([...decision.events]),
    scope: Object.freeze({ ...decision.scope }),
    stepIds: Object.freeze([...decision.stepIds]),
  })
}

function createStartLessonEffects(
  command: StartLearnerLessonCommand,
  scope: LearnerLessonScope,
  firstStepId: LessonStepId
): readonly StartLessonEffect[] {
  return Object.freeze([
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
  ])
}
