import { describe, expect, it } from "vitest"

import { learnerApiErrorSchema } from "#contracts/learning/api-error"
import {
  learnerCourseListResponseSchema,
  learnerLessonResponseSchema,
} from "#contracts/learning/learner-api"
import {
  completeLearnerStepBodySchema,
  completeLearnerStepResultSchema,
  learnerStepSubmissionSchema,
} from "#contracts/learning/learner-transition"

describe("학습자 API canonical 계약", () => {
  it("일반 오류와 검증 오류를 구분하고 알 수 없는 필드를 거절한다", () => {
    expect(
      learnerApiErrorSchema.safeParse({
        code: "UNAUTHENTICATED",
        message: "로그인이 필요합니다.",
        requestId: "request-1",
      }).success
    ).toBe(true)
    expect(
      learnerApiErrorSchema.safeParse({
        code: "VALIDATION_ERROR",
        message: "요청 내용을 확인해 주세요.",
        requestId: "request-2",
        violations: [{ message: "필수 값입니다.", path: "stepId" }],
      }).success
    ).toBe(true)
    expect(
      learnerApiErrorSchema.safeParse({
        code: "UNAUTHENTICATED",
        message: "로그인이 필요합니다.",
        requestId: "request-1",
        violations: [],
      }).success
    ).toBe(false)
  })

  it.each([
    "cause",
    "credential",
    "email",
    "password",
    "sql",
    "stack",
    "token",
  ])("공개 오류에서 민감한 내부 필드 %s를 거부한다", (field) => {
    expect(
      learnerApiErrorSchema.safeParse({
        code: "INTERNAL_SERVER_ERROR",
        message: "요청을 처리할 수 없습니다.",
        requestId: "request-3",
        [field]: "sensitive",
      }).success
    ).toBe(false)
  })

  it("요청의 root와 union 내부 알 수 없는 필드를 거절한다", () => {
    expect(
      learnerStepSubmissionSchema.safeParse({
        selectedOptionId: "option-1",
        type: "MULTIPLE_CHOICE",
        unknown: true,
      }).success
    ).toBe(false)
    expect(
      completeLearnerStepBodySchema.safeParse({
        answer: {
          selectedOptionId: "option-1",
          type: "MULTIPLE_CHOICE",
        },
        kind: "answer",
        unknown: true,
      }).success
    ).toBe(false)
  })

  it("응답 객체의 계약 외 필드를 거절한다", () => {
    expect(
      learnerCourseListResponseSchema.safeParse({
        items: [],
        internal: true,
        nextCursor: null,
      }).success
    ).toBe(false)
  })

  it("새 단계 완료 요청은 stable item ID와 명시적 intent만 허용한다", () => {
    expect(
      completeLearnerStepBodySchema.safeParse({
        answer: {
          selectedOptionId: "option-1",
          type: "MULTIPLE_CHOICE",
        },
        kind: "answer",
      }).success
    ).toBe(true)
    expect(
      completeLearnerStepBodySchema.safeParse({
        answer: { selectedIndexes: [0], type: "SELECT" },
        kind: "answer",
      }).success
    ).toBe(false)
    expect(
      completeLearnerStepResultSchema.safeParse({
        evaluation: null,
        learning: {
          completedSteps: 1,
          currentStepId: "step-2",
          currentStepIndex: 1,
          progressPercent: 50,
          status: "in_progress",
          totalSteps: 2,
          version: { curriculumVersionId: "curriculum:c1:1", revision: 1 },
        },
        status: "advanced",
      }).success
    ).toBe(true)
  })

  it("공개 lesson step은 solution field를 거절한다", () => {
    const lesson = {
      category: "입문",
      courseId: "course-1",
      description: "설명",
      estimatedMinutes: 5,
      id: "lesson-1",
      learning: {
        status: "not_started",
        totalSteps: 1,
        version: { curriculumVersionId: "course-1-v1", revision: 1 },
      },
      steps: [
        {
          id: "step-1",
          options: [
            { id: "option-1", text: "첫째" },
            { id: "option-2", text: "둘째" },
          ],
          question: "질문",
          sortOrder: 1,
          type: "MULTIPLE_CHOICE",
        },
      ],
      summary: [],
      title: "레슨",
      unitId: "unit-1",
      version: { curriculumVersionId: "course-1-v1", revision: 1 },
    }

    expect(learnerLessonResponseSchema.safeParse(lesson).success).toBe(true)
    expect(
      learnerLessonResponseSchema.safeParse({
        ...lesson,
        steps: [
          {
            ...lesson.steps[0],
            correct: "option-1",
            explanation: "정답 해설",
          },
        ],
      }).success
    ).toBe(false)
  })
})
