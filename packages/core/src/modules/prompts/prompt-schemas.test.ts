import { describe, expect, test } from "vitest"

import {
  createPromptBodySchema,
  updatePromptBodySchema,
} from "./prompt-schemas"

describe("prompt-schemas", () => {
  test("accepts valid create payloads", () => {
    expect(
      createPromptBodySchema.safeParse({
        title: "오늘의 글감",
        body: "비 오는 날의 냄새를 묘사해 보세요.",
        promptType: "sensory",
        thumbnailUrl: "https://example.com/prompt.png",
      }).success
    ).toBe(true)
  })

  test("rejects invalid create payloads", () => {
    expect(
      createPromptBodySchema.safeParse({
        title: "",
        body: "본문",
        promptType: "sensory",
      }).success
    ).toBe(false)

    expect(
      createPromptBodySchema.safeParse({
        title: "제목",
        body: "",
        promptType: "reflection",
      }).success
    ).toBe(false)
  })

  test("accepts partial update payloads", () => {
    expect(
      updatePromptBodySchema.safeParse({
        thumbnailUrl: null,
      }).success
    ).toBe(true)
  })
})
