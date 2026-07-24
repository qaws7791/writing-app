import { describe, expect, it } from "vitest"

import {
  createAdminLoginPath,
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
})
