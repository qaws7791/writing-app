import { describe, expect, it } from "vitest"

import { courseIdSchema } from "#contracts/content/ids"

describe("식별자 스키마 정본", () => {
  it.each(["", " id-1", "id 1", "id/1", "가나다", "-id", "a".repeat(201)])(
    "형식과 길이 규칙을 위반한 ID를 거부한다: %s",
    (value) => {
      expect(courseIdSchema.safeParse(value).success).toBe(false)
    }
  )
})
