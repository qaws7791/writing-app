import { describe, expect, it } from "vitest"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"

import { createAdminApp, registerAdminApiDocumentation } from "@/http/admin-app"
import { createLearnerApp } from "@/http/learner-app"
import { registerLearnerApiDocumentation } from "@/http/openapi"
import { createTestLearnerApp } from "@/test-support/learner-app-fixture"

type DocumentationApp = Readonly<{
  request: (path: string) => Promise<Response> | Response
}>

const removedLearnerWritePaths = [
  "/learning/answers",
  "/learning/lessons/{lessonId}/progress",
  "/learning/lessons/{lessonId}/complete",
  "/ai-feedback",
] as const

const documentationAudiences = [
  [
    "learner",
    (enabled: boolean): DocumentationApp => {
      if (enabled) return createTestLearnerApp()

      const app = createLearnerApp({})
      registerLearnerApiDocumentation(app, { enabled: false })
      return app
    },
  ],
  [
    "admin",
    (enabled: boolean): DocumentationApp => {
      const app = createAdminApp({
        adminOrigin: localRuntimeDefaults.adminWebOrigin,
      })
      registerAdminApiDocumentation(app, { enabled })
      return app
    },
  ],
] as const

describe("플랫폼 API openapi route", () => {
  it("learner 문서는 쿠키 session security scheme만 노출하고 보호 route에 적용한다", async () => {
    const app = createTestLearnerApp()

    const response = await app.request("/openapi")
    const document = (await response.json()) as object

    expect(response.status).toBe(200)
    expect(document).toHaveProperty(
      ["components", "securitySchemes", "learnerSessionCookie"],
      { in: "cookie", name: learnerSessionCookieName, type: "apiKey" }
    )
    expect(document).not.toHaveProperty([
      "components",
      "securitySchemes",
      "bearerAuth",
    ])
    expect(document).toHaveProperty(
      ["paths", "/profile", "get", "security"],
      [{ learnerSessionCookie: [] }]
    )
  })

  it("제거한 학습 쓰기 경로를 learner 문서에 다시 노출하지 않는다", async () => {
    const app = createTestLearnerApp()

    const document = (await (await app.request("/openapi")).json()) as {
      readonly paths: Readonly<Record<string, unknown>>
    }

    expect(
      removedLearnerWritePaths.filter((path) => path in document.paths)
    ).toEqual([])
  })

  it.each(documentationAudiences)(
    "%s 문서를 비활성화하면 openapi와 docs route를 등록하지 않는다",
    async (_audience, createApp) => {
      const disabled = createApp(false)

      expect((await disabled.request("/openapi")).status).toBe(404)
      expect((await disabled.request("/docs")).status).toBe(404)
    }
  )
})
