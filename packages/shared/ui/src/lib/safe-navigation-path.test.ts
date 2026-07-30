import { describe, expect, it } from "vitest"

import { resolveSafeInternalPath } from "#ui/lib/safe-navigation-path"

function resolve(candidate: string): string {
  return resolveSafeInternalPath({
    blockedPathnames: ["/login"],
    candidate,
    defaultPath: "/",
  })
}

describe("내부 이동 경로", () => {
  it("같은 출처의 절대 경로는 query와 fragment까지 유지한다", () => {
    expect(resolve("/courses?status=active#list")).toBe(
      "/courses?status=active#list"
    )
  })

  it.each([
    ["프로토콜 상대 URL", "//evil.example"],
    ["백슬래시 우회", "/\\evil.example"],
    ["절대 URL", "https://evil.example"],
    ["차단된 경로", "/login/again"],
    ["개행 주입", "/courses%0Aevil"],
    ["인코딩한 백슬래시", "/%5Cevil.example"],
    ["잘못된 percent-encoding", "/courses%ZZ"],
  ])("%s(%s)는 기본 경로로 되돌린다", (_label, candidate) => {
    expect(resolve(candidate)).toBe("/")
  })
})
