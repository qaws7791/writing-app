import { describe, expect, test } from "vitest"

import {
  createJourneyBodySchema,
  createSessionBodySchema,
  createStepBodySchema,
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
        type: "write",
        order: 1,
        contentJson: { prompt: "write something" },
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
        contentJson: { title: "updated" },
      }).success
    ).toBe(true)
  })

  test("parses valid step id params and rejects invalid values", () => {
    expect(stepIdParamSchema.parse("3")).toBe(3)
    expect(stepIdParamSchema.safeParse("0").success).toBe(false)
    expect(stepIdParamSchema.safeParse("not-a-number").success).toBe(false)
  })
})
