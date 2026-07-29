import { describe, expect, it } from "vitest"

import { courseIdSchema } from "#contracts/content/ids"
import { userIdSchema } from "#contracts/identity/admin-ids"
import { learnerIdSchema } from "#contracts/learning/ids"

describe("식별자 스키마 정본", () => {
  it.each(["", " id-1", "id 1", "id/1", "가나다", "-id", "a".repeat(201)])(
    "형식과 길이 규칙을 위반한 ID를 거부한다: %s",
    (value) => {
      expect(courseIdSchema.safeParse(value).success).toBe(false)
    }
  )

  it.each([
    ["learnerIdSchema", learnerIdSchema],
    ["userIdSchema", userIdSchema],
  ])("%s도 같은 정본 규칙을 쓴다", (_name, schema) => {
    expect(schema.safeParse("id 1").success).toBe(false)
    expect(schema.parse("id_1.example:2")).toBe("id_1.example:2")
  })
})
