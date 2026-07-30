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

  it.each([
    {
      expected: "provider-failed",
      label: "반복된 authError query의 첫 값도 연결 실패로 정규화한다",
      searchParams: { authError: ["true"] },
    },
    {
      expected: undefined,
      label: "true가 아닌 authError는 인증 실패 상태로 보지 않는다",
      searchParams: { authError: "1" },
    },
    {
      expected: undefined,
      label: "authError가 없으면 인증 실패 상태를 만들지 않는다",
      searchParams: { verified: "true" },
    },
  ])("$label", ({ expected, searchParams }) => {
    expect(parseLoginSearchParams(searchParams).authenticationStatus).toBe(
      expected
    )
  })
})
