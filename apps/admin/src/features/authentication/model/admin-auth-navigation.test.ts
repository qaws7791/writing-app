import { describe, expect, it } from "vitest"

import {
  adminLoginReasons,
  createAdminLoginPath,
  resolveAdminLoginReason,
  resolveSafeAdminNextPath,
} from "@/features/authentication/model/admin-auth-navigation"

describe("admin auth navigation", () => {
  it("로그인 next 경로를 내부 경로로만 제한한다", () => {
    expect(resolveSafeAdminNextPath("/courses")).toBe("/courses")
    expect(resolveSafeAdminNextPath("//evil.example")).toBe("/")
    expect(resolveSafeAdminNextPath("/\\evil.example")).toBe("/")
    expect(resolveSafeAdminNextPath("https://evil.example")).toBe("/")
    expect(resolveSafeAdminNextPath("/login?next=/courses")).toBe("/")
    expect(resolveSafeAdminNextPath("/courses%0Aevil")).toBe("/")
    expect(createAdminLoginPath("/courses")).toBe("/login?next=%2Fcourses")
  })

  it("세션 만료 사유만 로그인 경로와 화면 안내로 전달한다", () => {
    expect(
      createAdminLoginPath("/courses", adminLoginReasons.sessionExpired)
    ).toBe("/login?next=%2Fcourses&reason=session-expired")
    expect(resolveAdminLoginReason("session-expired")).toBe(
      adminLoginReasons.sessionExpired
    )
    expect(resolveAdminLoginReason("expired")).toBeNull()
    expect(resolveAdminLoginReason(undefined)).toBeNull()
  })
})
