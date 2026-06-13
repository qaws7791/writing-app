import { describe, expect, it } from "vitest"

import {
  createGoogleLoginPath,
  createLogoutPath,
  resolveSafeNextPath,
} from "@/lib/auth/auth-navigation"

describe("auth navigation", () => {
  it("로그인과 로그아웃 callback 경로를 안전하게 만든다", () => {
    expect(resolveSafeNextPath("/app/profile")).toBe("/app/profile")
    expect(resolveSafeNextPath("https://example.com/app")).toBe("/app")
    expect(createGoogleLoginPath("/app/profile")).toBe(
      "/api/auth/sign-in/google?callbackURL=%2Fapp%2Fprofile"
    )
    expect(createLogoutPath("/")).toBe("/api/auth/sign-out?callbackURL=%2F")
  })
})
