import { describe, expect, it } from "vitest"

import {
  explanationSchema,
  questionPromptSchema,
  readingBodySchema,
} from "#contracts/content/authoring/authoring-text-schemas"

describe("authoring text schemas", () => {
  it("READING 본문 상·하한을 검사한다", () => {
    expect(readingBodySchema.safeParse("짧은 본문").success).toBe(false)
    expect(
      readingBodySchema.safeParse(
        "로서는 자격을, 로써는 수단을 뜻합니다. 두 표기를 헷갈리지 마세요."
      ).success
    ).toBe(true)
    expect(readingBodySchema.safeParse("가".repeat(151)).success).toBe(false)
  })

  it("문항 지시문 상·하한을 검사한다", () => {
    expect(questionPromptSchema.safeParse("고르").success).toBe(false)
    expect(questionPromptSchema.safeParse("맞는 문장은?").success).toBe(true)
    expect(questionPromptSchema.safeParse("가".repeat(21)).success).toBe(false)
  })

  it("해설 상·하한을 검사한다", () => {
    expect(explanationSchema.safeParse("짧").success).toBe(false)
    expect(explanationSchema.safeParse("'로써'가 맞아요.").success).toBe(true)
    expect(explanationSchema.safeParse("가".repeat(41)).success).toBe(false)
  })
})
