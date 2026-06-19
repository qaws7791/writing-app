import { describe, expect, it } from "vitest"

import {
  courseIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@/modules/content/domain/content.ids"
import {
  lessonDtoSchema,
  type LessonDto,
} from "@/modules/content/domain/content.dto"
import { resolveAiFeedbackStep } from "@/modules/ai-feedback/domain/ai-feedback-step-policy"

describe("AI 피드백 스텝 정책", () => {
  it("AI_FEEDBACK 스텝을 피드백 대상 스텝으로 해석한다", () => {
    expect(
      resolveAiFeedbackStep({
        lesson,
        stepId: lessonStepIdSchema.parse("l1-s2"),
      })
    ).toMatchObject({
      kind: "accepted",
      step: {
        focus: "명확성",
        type: "AI_FEEDBACK",
      },
    })
  })

  it("레슨에 없는 스텝과 AI 피드백 대상이 아닌 스텝을 구분한다", () => {
    expect(
      resolveAiFeedbackStep({
        lesson,
        stepId: lessonStepIdSchema.parse("missing-step"),
      })
    ).toEqual({
      kind: "rejected",
      reason: "step-not-found-in-lesson",
      stepId: lessonStepIdSchema.parse("missing-step"),
    })

    expect(
      resolveAiFeedbackStep({
        lesson,
        stepId: lessonStepIdSchema.parse("l1-s1"),
      })
    ).toEqual({
      kind: "rejected",
      reason: "step-feedback-not-supported",
      stepId: lessonStepIdSchema.parse("l1-s1"),
    })
  })
})

const lesson: LessonDto = lessonDtoSchema.parse({
  category: "문장의 기본기",
  courseId: courseIdSchema.parse("c1"),
  description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
  estimatedMinutes: 5,
  id: lessonIdSchema.parse("l1"),
  steps: [
    {
      body: "좋은 문장은 한 가지 의미를 분명히 전달합니다.",
      guide: "좋은 문장의 기준을 읽습니다.",
      id: lessonStepIdSchema.parse("l1-s1"),
      sortOrder: 1,
      title: "명료성의 원칙",
      type: "READING",
    },
    {
      allowRetry: true,
      feedback: "주장과 근거가 명확히 구분되어 있습니다.",
      focus: "명확성",
      id: lessonStepIdSchema.parse("l1-s2"),
      score: 92,
      scoreMax: 100,
      showScore: true,
      sortOrder: 2,
      target: "l1-s-write",
      type: "AI_FEEDBACK",
    },
  ],
  summary: ["좋은 문장은 모호하지 않다"],
  title: "좋은 문장이란 무엇인가",
  unitId: unitIdSchema.parse("u1"),
})
