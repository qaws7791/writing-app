import { describe, expect, it } from "vitest"

import {
  courseIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
} from "@workspace/contracts/content/ids"
import {
  curriculumVersionIdSchema,
  learnerIdSchema,
} from "@workspace/contracts/learning/step-data"

import {
  decideStartLesson,
  type StartLessonSnapshot,
} from "#learning/domain/start-lesson-decision"

const occurredAt = new Date("2026-07-17T09:00:00.000Z")
const command = {
  expectedCurriculumVersionId: curriculumVersionIdSchema.parse(
    "curriculum:course-1:1"
  ),
  lessonId: lessonIdSchema.parse("lesson-1"),
  occurredAt,
  userId: learnerIdSchema.parse("learner-1"),
}
const availableSnapshot = {
  isUnlocked: true,
  kind: "lesson",
  progress: { kind: "not-started" },
  scope: {
    courseId: courseIdSchema.parse("course-1"),
    curriculumVersionId: command.expectedCurriculumVersionId,
    lessonId: command.lessonId,
    revision: 1,
  },
  stepIds: [lessonStepIdSchema.parse("step-1")],
} as const satisfies StartLessonSnapshot

describe("학습 시작 의사결정", () => {
  it("scope가 없으면 lesson-not-found를 가장 먼저 반환한다", () => {
    expect(decideStartLesson(command, { kind: "lesson-not-found" })).toEqual({
      error: { kind: "lesson-not-found", lessonId: command.lessonId },
      kind: "rejected",
    })
  })

  it("version 충돌을 잠금과 빈 step보다 먼저 반환한다", () => {
    expect(
      decideStartLesson(command, {
        ...availableSnapshot,
        isUnlocked: false,
        scope: {
          ...availableSnapshot.scope,
          curriculumVersionId: curriculumVersionIdSchema.parse(
            "curriculum:course-1:2"
          ),
        },
        stepIds: [],
      })
    ).toEqual({
      error: {
        kind: "curriculum-version-changed",
        lessonId: command.lessonId,
      },
      kind: "rejected",
    })
  })

  it("잠금을 빈 step보다 먼저 반환하고 unlocked 빈 lesson은 not-found다", () => {
    expect(
      decideStartLesson(command, {
        ...availableSnapshot,
        isUnlocked: false,
        stepIds: [],
      })
    ).toEqual({
      error: { kind: "lesson-locked", lessonId: command.lessonId },
      kind: "rejected",
    })
    expect(
      decideStartLesson(command, { ...availableSnapshot, stepIds: [] })
    ).toEqual({
      error: { kind: "lesson-not-found", lessonId: command.lessonId },
      kind: "rejected",
    })
  })

  it("신규 시작에 결정적 ensure와 활동 effect를 만든다", () => {
    const decision = decideStartLesson(command, availableSnapshot)

    expect(decision).toEqual({
      aggregate: {
        scope: availableSnapshot.scope,
        stepIds: availableSnapshot.stepIds,
        userId: command.userId,
      },
      effects: [
        {
          courseId: availableSnapshot.scope.courseId,
          curriculumVersionId: command.expectedCurriculumVersionId,
          kind: "ensure-course-started",
          occurredAt,
          userId: command.userId,
        },
        {
          courseId: availableSnapshot.scope.courseId,
          curriculumVersionId: command.expectedCurriculumVersionId,
          firstStepId: availableSnapshot.stepIds[0],
          kind: "ensure-lesson-started",
          lessonId: command.lessonId,
          occurredAt,
          userId: command.userId,
        },
        {
          activityDate: "2026-07-17",
          courseId: availableSnapshot.scope.courseId,
          curriculumVersionId: command.expectedCurriculumVersionId,
          kind: "record-learning-activity",
          occurredAt,
          userId: command.userId,
        },
      ],
      kind: "start",
      scope: availableSnapshot.scope,
      stepIds: availableSnapshot.stepIds,
      userId: command.userId,
    })
  })

  it("기존 진행 replay도 같은 idempotent effect로 수렴한다", () => {
    const started = decideStartLesson(command, availableSnapshot)
    const replayed = decideStartLesson(command, {
      ...availableSnapshot,
      progress: { kind: "started" },
    })

    expect(replayed).toMatchObject({ kind: "replay" })
    if (started.kind === "start" && replayed.kind === "replay") {
      expect(replayed.effects).toEqual(started.effects)
    }
  })
})
