import { describe, expect, it } from "vitest"

import { buildApiUrl } from "@/shared/config/api-base-url"

describe("buildApiUrl", () => {
  it("base URL이 없으면 브라우저가 쓸 상대 경로로 조합한다", () => {
    expect(buildApiUrl(undefined, "/api/admin/auth/sign-in/email")).toBe(
      "/api/admin/auth/sign-in/email"
    )
  })

  it("선행 slash가 없는 path도 절대 경로로 정규화한다", () => {
    expect(buildApiUrl(undefined, "api/admin/courses")).toBe(
      "/api/admin/courses"
    )
  })
})
