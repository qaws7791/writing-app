import { describe, expect, it } from "vitest"

import { adminIdSchema, userIdSchema } from "#contracts/identity/admin-ids"

describe("어드민 식별자 parser", () => {
  it.each([
    [adminIdSchema, "admin-1"],
    [adminIdSchema, "0192f6e4-2344-7a23-a7ab-8db7190a72af"],
    [userIdSchema, "user_1.example"],
  ])("유효한 문자열 wire format을 유지한다", (schema, value) => {
    const parsed = schema.parse(value)

    expect(parsed).toBe(value)
    expect(JSON.stringify(parsed)).toBe(JSON.stringify(value))
  })
})
