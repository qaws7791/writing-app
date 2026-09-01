import { describe, expect, it } from "vitest"
import type {
  CourseId,
  CurriculumVersionId,
  LearnerId,
  LessonId,
  LessonStepId,
} from "@workspace/types/ids"

import { lessonStepDtoSchema } from "@workspace/contracts/content/course"
import {
  planCompleteLesson,
  type CompleteLessonSnapshot,
} from "#learning/domain/complete-lesson-effect-plan"
import type { CompleteLearnerLessonCommand } from "#learning/domain/learner-transition"

describe("planCompleteLesson", () => {
  const baseCommand: CompleteLearnerLessonCommand = {
    completedStepIds: ["step-1" as LessonStepId, "step-2" as LessonStepId],
    durationSeconds: 120,
    expectedCurriculumVersionId: "curriculum:1:1" as CurriculumVersionId,
    lessonId: "lesson-1" as LessonId,
    mistakeCount: 1,
    occurredAt: new Date("2026-09-01T10:00:00Z"),
    totalAttempts: 5,
    userId: "learner-1" as LearnerId,
  }

  const baseSnapshot: CompleteLessonSnapshot = {
    completedLessonIds: [],
    courseCompletionLessonIds: ["lesson-1" as LessonId, "lesson-2" as LessonId],
    kind: "lesson",
    progress: {
      currentStepId: "step-1" as LessonStepId,
      kind: "in-progress",
    },
    scope: {
      courseId: "course-1" as CourseId,
      curriculumVersionId: "curriculum:1:1" as CurriculumVersionId,
      lessonId: "lesson-1" as LessonId,
      revision: 1,
    },
    steps: [
      lessonStepDtoSchema.parse({
        body: "이것은 최소 20자 이상을 충족하는 리딩 본문 내용 1입니다.",
        id: "step-1",
        sortOrder: 1,
        title: "제목 1",
        type: "READING",
      }),
      lessonStepDtoSchema.parse({
        body: "이것은 최소 20자 이상을 충족하는 리딩 본문 내용 2입니다.",
        id: "step-2",
        sortOrder: 2,
        title: "제목 2",
        type: "READING",
      }),
    ],
  }

  it("정상적으로 레슨 완료 이펙트를 생성하고 정답률을 계산한다", () => {
    const plan = planCompleteLesson(baseCommand, baseSnapshot)
    expect(plan.kind).toBe("accept-lesson")
    if (plan.kind !== "accept-lesson") return

    expect(plan.accuracyPercent).toBe(80) // (5 - 1) / 5 * 100 = 80
    expect(plan.durationMinutes).toBe(2)
    expect(plan.effects).toHaveLength(2) // complete-lesson, record-learning-activity
    expect(plan.effects[0]?.kind).toBe("complete-lesson")
    expect(plan.effects[1]?.kind).toBe("record-learning-activity")
  })

  it("마지막 남은 레슨 완료 시 코스 완료 이펙트를 함께 생성한다", () => {
    const finalLessonSnapshot: CompleteLessonSnapshot = {
      ...baseSnapshot,
      completedLessonIds: ["lesson-2" as LessonId],
      courseCompletionLessonIds: [
        "lesson-1" as LessonId,
        "lesson-2" as LessonId,
      ],
    }

    const plan = planCompleteLesson(baseCommand, finalLessonSnapshot)
    expect(plan.kind).toBe("accept-lesson")
    if (plan.kind !== "accept-lesson") return

    expect(plan.effects.some((e) => e.kind === "complete-course")).toBe(true)
  })

  it("커리큘럼 버전이 다르면 거절한다", () => {
    const plan = planCompleteLesson(
      {
        ...baseCommand,
        expectedCurriculumVersionId: "curriculum:1:2" as CurriculumVersionId,
      },
      baseSnapshot
    )
    expect(plan.kind).toBe("rejected")
  })
})
