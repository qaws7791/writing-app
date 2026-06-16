import { afterEach, describe, expect, it } from "vitest"
import { localRuntimeDefaults } from "@workspace/env"

import { createAdminGoogleSignInPath } from "@/lib/auth/admin-auth-client"

describe("admin auth client", () => {
  afterEach(() => {
    delete process.env["ADMIN_API_BASE_URL"]
  })

  it("관리자 API의 Better Auth Google 로그인 endpoint를 직접 가리킨다", () => {
    process.env["ADMIN_API_BASE_URL"] = localRuntimeDefaults.adminApiBaseUrl

    expect(createAdminGoogleSignInPath("/courses")).toBe(
      `${localRuntimeDefaults.adminApiBaseUrl}/api/auth/sign-in/google?callbackURL=%2Fcourses`
    )
  })
})
