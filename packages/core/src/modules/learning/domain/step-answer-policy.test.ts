import { describe, expect, it } from "vitest"

import {
  courseIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@/modules/content/domain/content.ids"
import { lessonDtoSchema, type LessonDto } from "@workspace/contracts/content"
import { validateStepAnswerForLesson } from "@/modules/learning/domain/step-answer-policy"

describe("스텝 답변 정책", () => {
  it("레슨 시작 마커는 첫 스텝에서만 허용한다", () => {
    expect(
      validateStepAnswerForLesson({
        answer: { kind: "lesson-started" },
        lesson,
        stepId: lessonStepIdSchema.parse("l1-s1"),
      })
    ).toEqual({ kind: "accepted" })

    expect(
      validateStepAnswerForLesson({
        answer: { kind: "lesson-started" },
        lesson,
        stepId: lessonStepIdSchema.parse("l1-s2"),
      })
    ).toEqual({
      kind: "rejected",
      reason: "step-answer-shape-invalid",
      stepId: lessonStepIdSchema.parse("l1-s2"),
    })
  })

  it("스텝 타입과 답변 타입, 콘텐츠 후보를 함께 검증한다", () => {
    expect(
      validateStepAnswerForLesson({
        answer: { selectedOptionId: "b", type: "MULTIPLE_CHOICE" },
        lesson,
        stepId: lessonStepIdSchema.parse("l1-s2"),
      })
    ).toEqual({ kind: "accepted" })

    expect(
      validateStepAnswerForLesson({
        answer: { selectedOptionId: "missing", type: "MULTIPLE_CHOICE" },
        lesson,
        stepId: lessonStepIdSchema.parse("l1-s2"),
      })
    ).toEqual({
      kind: "rejected",
      reason: "step-answer-invalid",
      stepId: lessonStepIdSchema.parse("l1-s2"),
    })

    expect(
      validateStepAnswerForLesson({
        answer: { text: "객관식에 쓰기 답변", type: "WRITE" },
        lesson,
        stepId: lessonStepIdSchema.parse("l1-s2"),
      })
    ).toEqual({
      kind: "rejected",
      reason: "step-answer-shape-invalid",
      stepId: lessonStepIdSchema.parse("l1-s2"),
    })
  })

  it("답변 대상이 아닌 스텝과 레슨에 없는 스텝을 구분한다", () => {
    expect(
      validateStepAnswerForLesson({
        answer: { selectedOptionId: "b", type: "MULTIPLE_CHOICE" },
        lesson,
        stepId: lessonStepIdSchema.parse("l1-s1"),
      })
    ).toEqual({
      kind: "rejected",
      reason: "step-answer-not-supported",
      stepId: lessonStepIdSchema.parse("l1-s1"),
    })

    expect(
      validateStepAnswerForLesson({
        answer: { selectedOptionId: "b", type: "MULTIPLE_CHOICE" },
        lesson,
        stepId: lessonStepIdSchema.parse("missing-step"),
      })
    ).toEqual({
      kind: "rejected",
      reason: "step-not-found-in-lesson",
      stepId: lessonStepIdSchema.parse("missing-step"),
    })
  })
})

const lesson: LessonDto = lessonDtoSchema.parse({
  id: lessonIdSchema.parse("l1"),
  courseId: courseIdSchema.parse("c1"),
  unitId: unitIdSchema.parse("u1"),
  title: "좋은 문장이란 무엇인가",
  category: "문장의 기본기",
  description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
  estimatedMinutes: 5,
  summary: ["좋은 문장은 모호하지 않다"],
  steps: [
    {
      id: lessonStepIdSchema.parse("l1-s1"),
      type: "READING",
      sortOrder: 1,
      title: "명료성의 원칙",
      guide: "좋은 문장의 기준을 읽습니다.",
      body: "좋은 문장은 한 가지 의미를 분명히 전달합니다.",
    },
    {
      id: lessonStepIdSchema.parse("l1-s2"),
      type: "MULTIPLE_CHOICE",
      sortOrder: 2,
      question: "한 문단에 들어가야 할 주제문의 수는?",
      options: [
        { id: "a", text: "2개 이상" },
        { id: "b", text: "정확히 1개" },
      ],
      correct: "b",
      explanation: "하나의 문단에는 하나의 핵심 주제문이 들어갑니다.",
    },
  ],
})
