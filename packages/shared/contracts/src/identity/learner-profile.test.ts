import { describe, expect, it } from "vitest"

import { learnerUpdateProfileRequestSchema } from "#contracts/identity/learner-profile"

describe("learner profile contract", () => {
  it("표시 이름을 정규화하고 빈 값과 허용 길이 초과를 거절한다", () => {
    expect(
      learnerUpdateProfileRequestSchema.parse({ name: "  새 이름  " })
    ).toEqual({ name: "새 이름" })
    expect(
      learnerUpdateProfileRequestSchema.safeParse({ name: "   " }).success
    ).toBe(false)
    expect(
      learnerUpdateProfileRequestSchema.safeParse({ name: "가".repeat(201) })
        .success
    ).toBe(false)
  })

  it("wire 입력에 선언되지 않은 필드를 허용하지 않는다", () => {
    expect(
      learnerUpdateProfileRequestSchema.safeParse({
        image: "https://example.test/avatar.png",
        name: "새 이름",
      }).success
    ).toBe(false)
  })
})
