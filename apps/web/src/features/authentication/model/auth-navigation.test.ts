import { describe, expect, it } from "vitest"

import {
  createLoginPagePath,
  createVerifiedLoginPagePath,
  resolveSafeNextPath,
} from "@/features/authentication/model/auth-navigation"

describe("auth navigation", () => {
  it("로그인 callback 경로를 안전하게 만든다", () => {
    expect(resolveSafeNextPath("/app/profile")).toBe("/app/profile")
    expect(resolveSafeNextPath("https://example.com/app")).toBe("/app")
    expect(createLoginPagePath("/app/lesson?lesson_id=l1")).toBe(
      "/login?next=%2Fapp%2Flesson%3Flesson_id%3Dl1"
    )
    expect(createVerifiedLoginPagePath("/app/profile")).toBe(
      "/login?next=%2Fapp%2Fprofile&verified=true"
    )
  })
})
