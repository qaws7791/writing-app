import { describe, expect, it } from "vitest"

import { learnerLessonResponseSchema } from "#contracts/learning/learner-api"
import {
  completeLearnerStepBodySchema,
  learnerStepSubmissionSchema,
  saveLearnerStepDraftBodySchema,
} from "#contracts/learning/learner-transition"

describe("learner API wire invariants", () => {
  it("요청 root와 answer union의 계약 밖 필드를 거절한다", () => {
    const answerWithUnknownField = learnerStepSubmissionSchema.safeParse({
      selectedOptionId: "option-1",
      type: "MULTIPLE_CHOICE",
      unknown: true,
    })
    const requestWithUnknownField = completeLearnerStepBodySchema.safeParse({
      answer: {
        selectedOptionId: "option-1",
        type: "MULTIPLE_CHOICE",
      },
      kind: "answer",
      unknown: true,
    })

    expect({
      answer: answerWithUnknownField.success,
      request: requestWithUnknownField.success,
    }).toEqual({ answer: false, request: false })
  })

  it("배열 위치 대신 stable item ID를 가진 답안만 허용한다", () => {
    const stableIdAnswer = completeLearnerStepBodySchema.safeParse({
      answer: {
        selectedItemIds: ["segment-1"],
        type: "SELECT",
      },
      kind: "answer",
    })
    const indexAnswer = completeLearnerStepBodySchema.safeParse({
      answer: { selectedIndexes: [0], type: "SELECT" },
      kind: "answer",
    })

    expect({
      indexAnswer: indexAnswer.success,
      stableIdAnswer: stableIdAnswer.success,
    }).toEqual({ indexAnswer: false, stableIdAnswer: true })
  })

  it("draft compare-and-swap version은 null 또는 0 이상의 정수만 허용한다", () => {
    const body = {
      answer: { text: "저장 중인 글", type: "WRITE" },
      expectedCurriculumVersionId: "course-1-v1",
      expectedVersion: null,
    } as const

    expect(saveLearnerStepDraftBodySchema.safeParse(body).success).toBe(true)
    expect(
      saveLearnerStepDraftBodySchema.safeParse({
        ...body,
        expectedVersion: -1,
      }).success
    ).toBe(false)
  })

  it("학습자 레슨 응답에서 정답과 해설 필드를 거절한다", () => {
    const lesson = aLearnerLessonResponse()

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

function aLearnerLessonResponse() {
  return {
    category: "입문",
    courseId: "course-1",
    description: "설명",
    drafts: [],
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
}
