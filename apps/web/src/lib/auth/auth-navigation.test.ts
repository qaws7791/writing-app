import { describe, expect, it } from "vitest"

import {
  getAuthRedirectPath,
  getSafeNextPath,
} from "@/lib/auth/auth-navigation"

describe("auth-navigation", () => {
  it("builds login redirects with the requested app path", () => {
    expect(getAuthRedirectPath("/app/courses/sentence-structure")).toBe(
      "/login?next=%2Fapp%2Fcourses%2Fsentence-structure"
    )
  })

  it("keeps only internal app paths as next destinations", () => {
    expect(getSafeNextPath("/app")).toBe("/app")
    expect(getSafeNextPath("/app?tab=home")).toBe("/app?tab=home")
    expect(getSafeNextPath("/app/lesson?lesson_id=sentence-structure-01")).toBe(
      "/app/lesson?lesson_id=sentence-structure-01"
    )
    expect(getSafeNextPath("/app.evil")).toBe("/app")
    expect(getSafeNextPath("https://example.com/app")).toBe("/app")
    expect(getSafeNextPath("/login")).toBe("/app")
  })
})
