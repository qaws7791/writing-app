import { describe, expect, test } from "vitest"

import {
  createJourneyBodySchema,
  createSessionBodySchema,
  createStepBodySchema,
  stepSummarySchema,
  stepIdParamSchema,
  updateJourneyBodySchema,
  updateSessionBodySchema,
  updateStepBodySchema,
} from "./journey-schemas"

describe("journey-schemas", () => {
  test("accepts valid create payloads", () => {
    expect(
      createJourneyBodySchema.safeParse({
        title: "문장 다듬기",
        description: "설명",
        category: "writing_skill",
        thumbnailUrl: "https://example.com/journey.png",
      }).success
    ).toBe(true)

    expect(
      createSessionBodySchema.safeParse({
        title: "도입",
        description: "세션 설명",
        estimatedMinutes: 15,
        order: 1,
      }).success
    ).toBe(true)

    expect(
      createStepBodySchema.safeParse({
        type: "WRITING",
        order: 1,
        contentJson: {
          type: "WRITING",
          content: {
            type: "WRITING",
            prompt: "write something",
            minLength: 1,
            recommendedLength: 10,
            timeLimitSeconds: 0,
          },
          cta: {
            label: "다음",
            variant: "primary",
          },
        },
      }).success
    ).toBe(true)
  })

  test("rejects invalid create payloads", () => {
    expect(
      createJourneyBodySchema.safeParse({
        title: "",
        description: "설명",
        category: "writing_skill",
      }).success
    ).toBe(false)

    expect(
      createSessionBodySchema.safeParse({
        title: "세션",
        description: "설명",
        estimatedMinutes: 0,
        order: 1,
      }).success
    ).toBe(false)

    expect(
      createStepBodySchema.safeParse({
        type: "invalid",
        order: 1,
        contentJson: {},
      }).success
    ).toBe(false)
  })

  test("accepts partial update payloads", () => {
    expect(
      updateJourneyBodySchema.safeParse({
        thumbnailUrl: null,
      }).success
    ).toBe(true)

    expect(
      updateSessionBodySchema.safeParse({
        order: 2,
      }).success
    ).toBe(true)

    expect(
      updateStepBodySchema.safeParse({
        type: "CONCEPT",
        contentJson: {
          type: "CONCEPT",
          content: {
            type: "CONCEPT",
            title: "updated",
            body: "body",
          },
          cta: {
            label: "다음",
            variant: "primary",
          },
        },
      }).success
    ).toBe(true)
  })

  test("parses valid step id params and rejects invalid values", () => {
    expect(stepIdParamSchema.parse("3")).toBe(3)
    expect(stepIdParamSchema.safeParse("0").success).toBe(false)
    expect(stepIdParamSchema.safeParse("not-a-number").success).toBe(false)
  })

  test("parses typed session step payloads from step summaries", () => {
    expect(
      stepSummarySchema.safeParse({
        id: 1,
        sessionId: 1,
        order: 1,
        type: "WRITING",
        contentJson: {
          type: "WRITING",
          content: {
            type: "WRITING",
            prompt: "오늘의 장면을 써 보세요.",
            minLength: 50,
            recommendedLength: 200,
            timeLimitSeconds: 0,
          },
          cta: {
            label: "제출하기",
            variant: "primary",
          },
        },
      }).success
    ).toBe(true)
  })

  test("rejects mismatched step payload type and content type", () => {
    expect(
      stepSummarySchema.safeParse({
        id: 1,
        sessionId: 1,
        order: 1,
        type: "AI_FEEDBACK",
        contentJson: {
          type: "AI_FEEDBACK",
          content: {
            type: "AI_COMPARISON",
            originalStepId: "1",
            rewritingStepId: "2",
            loadingMessage: "비교 중",
          },
          cta: {
            label: "다음",
            variant: "primary",
          },
        },
      }).success
    ).toBe(false)
  })
})
