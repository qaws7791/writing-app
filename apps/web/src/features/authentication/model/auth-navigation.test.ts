import { describe, expect, it } from "vitest"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import {
  createLoginPagePath,
  resolveSafeNextPath,
} from "@/features/authentication/model/auth-navigation"

describe("auth navigation", () => {
  it("로그인 callback 경로를 안전하게 만든다", () => {
    process.env["NEXT_PUBLIC_API_BASE_URL"] = localRuntimeDefaults.apiBaseUrl

    expect(resolveSafeNextPath("/app/profile")).toBe("/app/profile")
    expect(resolveSafeNextPath("https://example.com/app")).toBe("/app")
    expect(createLoginPagePath("/app/lesson?lesson_id=l1")).toBe(
      "/login?next=%2Fapp%2Flesson%3Flesson_id%3Dl1"
    )

    delete process.env["NEXT_PUBLIC_API_BASE_URL"]
  })
})
