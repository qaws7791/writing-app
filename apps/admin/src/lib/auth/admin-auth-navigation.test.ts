import { describe, expect, it } from "vitest"

import {
  getAdminLoginPath,
  getSafeAdminNextPath,
} from "@/lib/auth/admin-auth-navigation"

describe("admin-auth-navigation", () => {
  it("keeps safe internal admin paths", () => {
    expect(getSafeAdminNextPath("/courses")).toBe("/courses")
    expect(getSafeAdminNextPath("/courses?include=chapters")).toBe(
      "/courses?include=chapters"
    )
    expect(getSafeAdminNextPath("/users/active")).toBe("/users/active")
  })

  it("rejects unsafe or auth-owned paths", () => {
    expect(getSafeAdminNextPath("https://evil.example/courses")).toBe(
      "/courses"
    )
    expect(getSafeAdminNextPath("//evil.example/courses")).toBe("/courses")
    expect(getSafeAdminNextPath("/login")).toBe("/courses")
    expect(getSafeAdminNextPath("/login?next=%2Fusers")).toBe("/courses")
    expect(getSafeAdminNextPath("/api")).toBe("/courses")
    expect(getSafeAdminNextPath("/api/auth/sign-in/email")).toBe("/courses")
  })

  it("builds login paths with an encoded safe next path", () => {
    expect(getAdminLoginPath("/users?status=active")).toBe(
      "/login?next=%2Fusers%3Fstatus%3Dactive"
    )
    expect(getAdminLoginPath("https://evil.example/courses")).toBe(
      "/login?next=%2Fcourses"
    )
  })
})
