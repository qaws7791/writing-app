import { describe, expect, it } from "vitest"

import { parseLoginSearchParams } from "@/features/authentication/model/login-search-params"

describe("로그인 search params", () => {
  it("확인 성공과 실패를 구분하고 실패를 우선한다", () => {
    expect(
      parseLoginSearchParams({
        next: "/app/courses",
        verified: "true",
      })
    ).toEqual({
      authenticationStatus: undefined,
      next: "/app/courses",
      verificationStatus: "verified",
    })
    expect(
      parseLoginSearchParams({
        error: "invalid_token",
        next: "/app/courses",
        verified: "true",
      })
    ).toEqual({
      authenticationStatus: undefined,
      next: "/app/courses",
      verificationStatus: "failed",
    })
  })

  it("알 수 없는 입력은 안전한 빈 결과로 정규화한다", () => {
    expect(parseLoginSearchParams({ next: 42 })).toEqual({
      authenticationStatus: undefined,
      next: undefined,
      verificationStatus: undefined,
    })
  })

  it("OAuth provider 원문과 무관하게 연결 실패 상태 하나로 정규화한다", () => {
    expect(
      parseLoginSearchParams({
        authError: "true",
        error: "unable_to_link_account",
      })
    ).toEqual({
      authenticationStatus: "provider-failed",
      next: undefined,
      verificationStatus: undefined,
    })
  })
})
