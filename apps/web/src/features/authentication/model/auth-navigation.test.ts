import { describe, expect, it } from "vitest"

import {
  createLoginPagePath,
  createVerifiedLoginPagePath,
  resolveSafeNextPath,
} from "@/features/authentication/model/auth-navigation"

describe("auth navigation", () => {
  it.each([
    { candidate: "/app/profile", expected: "/app/profile", label: "내부 경로" },
    {
      candidate: ["/app/profile"],
      expected: "/app/profile",
      label: "반복된 query 값",
    },
    { candidate: undefined, expected: "/app", label: "없는 값" },
  ])(
    "callback 경로의 $label을 이동 가능한 내부 경로로 정규화한다",
    ({ candidate, expected }) => {
      expect(resolveSafeNextPath(candidate)).toBe(expected)
    }
  )

  it("로그인 재귀 경로는 기본 앱 경로로 차단한다", () => {
    expect(resolveSafeNextPath("/login?next=/app")).toBe("/app")
  })

  it("로그인 페이지 경로에 원래 목적지를 인코딩해 붙인다", () => {
    expect(createLoginPagePath("/app/lesson?lesson_id=l1")).toBe(
      "/login?next=%2Fapp%2Flesson%3Flesson_id%3Dl1"
    )
  })

  it("이메일 확인 완료 로그인 경로에 verified 표시를 함께 붙인다", () => {
    expect(createVerifiedLoginPagePath("/app/profile")).toBe(
      "/login?next=%2Fapp%2Fprofile&verified=true"
    )
  })
})
