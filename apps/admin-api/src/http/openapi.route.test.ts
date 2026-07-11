import { describe, expect, it } from "vitest"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"

import { createApp } from "@/app"
import { createTestAdminApiDependencies } from "@/routes/test-dependencies"

describe("어드민 API OpenAPI 인증 계약", () => {
  it("실제 관리자 세션 cookie 이름과 보호 route security를 고정한다", async () => {
    const app = createApp(createTestAdminApiDependencies())
    const response = await app.request("/openapi")
    const document = await response.json()

    expect(response.status).toBe(200)
    expect(document).toHaveProperty(
      ["components", "securitySchemes", "adminSessionCookie"],
      {
        in: "cookie",
        name: adminSessionCookieName,
        type: "apiKey",
      }
    )
    expect(document).toHaveProperty(
      ["paths", "/users", "get", "security"],
      [{ adminSessionCookie: [] }]
    )
  })
})
