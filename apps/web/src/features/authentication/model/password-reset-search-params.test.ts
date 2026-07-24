import { describe, expect, it } from "vitest"

import { parsePasswordResetSearchParams } from "@/features/authentication/model/password-reset-search-params"

describe("비밀번호 재설정 query", () => {
  it("유효한 첫 token만 사용한다", () => {
    expect(
      parsePasswordResetSearchParams({ token: ["first-token", "second-token"] })
    ).toEqual({ token: "first-token" })
  })

  it("오류 query나 빈 token은 재설정 권한으로 인정하지 않는다", () => {
    expect(
      parsePasswordResetSearchParams({
        error: "INVALID_TOKEN",
        token: "provider-token",
      })
    ).toEqual({ token: undefined })
    expect(parsePasswordResetSearchParams({ token: " " })).toEqual({
      token: undefined,
    })
  })
})
