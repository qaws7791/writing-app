import { describe, expect, it, vi } from "vitest"
import { createRoute, type OpenAPIHono } from "@hono/zod-openapi"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import { z } from "@workspace/http-platform/openapi"

import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@workspace/identity/ports"
import { registerAdminFoundationRoutes } from "@/http/admin-foundation.routes"
import type { AdminHonoEnv } from "@/http/admin-hono-env"
import { jsonResponse } from "@/http/admin-openapi"
import { adminSessionRouteOptions } from "@workspace/identity/http"
import {
  createAdminApp,
  registerAdminApiDocumentation,
  registerAdminAuthRoutes,
  type AdminAppDependencies,
} from "@/http/admin-app"

const adminId = adminIdSchema.parse("admin-1")
const adminOrigin = localRuntimeDefaults.adminWebOrigin

describe("통합 runtime 관리자 공통 delivery", () => {
  it("기능 route가 비어 있어도 health, session, OpenAPI 기반이 독립 실행된다", async () => {
    const app = createFixture()

    const healthResponse = await app.request("/health")
    const sessionResponse = await app.request("/session")
    const openApiResponse = await app.request("/openapi")
    const featureResponse = await app.request("/courses")

    expect(healthResponse.status).toBe(200)
    expect(sessionResponse.status).toBe(401)
    await expect(sessionResponse.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
    expect(openApiResponse.status).toBe(200)
    expect(featureResponse.status).toBe(404)
  })

  it("Scalar 문서 UI를 제공하고 비활성화 시 문서 route를 등록하지 않는다", async () => {
    const enabled = createFixture()
    const scalarResponse = await enabled.request("/docs")

    expect(scalarResponse.status).toBe(200)
    expect(scalarResponse.headers.get("content-type")).toContain("text/html")
    expect(await scalarResponse.text()).toContain("Writing App Admin API")

    const disabled = createAdminApp({ adminOrigin })
    registerAdminApiDocumentation(disabled, { enabled: false })
    expect((await disabled.request("/openapi")).status).toBe(404)
    expect((await disabled.request("/docs")).status).toBe(404)
  })

  it("관리자 비밀번호 변경은 요청값과 무관하게 다른 세션 폐기를 강제한다", async () => {
    const capturedRequests: Request[] = []
    const app = createFixture({
      async authHandler(request) {
        capturedRequests.push(request)

        return Response.json({ ok: true })
      },
    })

    const response = await app.request("/auth/change-password", {
      body: JSON.stringify({
        currentPassword: "old-password",
        newPassword: "new-password",
        revokeOtherSessions: false,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    expect(capturedRequests).toHaveLength(1)
    await expect(capturedRequests[0]?.json()).resolves.toEqual({
      currentPassword: "old-password",
      newPassword: "new-password",
      revokeOtherSessions: true,
    })
  })

  it("쿠키 변경 요청의 신뢰하지 않은 origin을 auth handler 전에 거절한다", async () => {
    const authHandler = vi.fn(async () => Response.json({ ok: true }))
    const app = createFixture({ authHandler })

    const response = await app.request("/auth/change-password", {
      body: JSON.stringify({
        currentPassword: "old-password",
        newPassword: "new-password",
      }),
      headers: {
        Cookie: `${adminSessionCookieName}=admin-token`,
        "Content-Type": "application/json",
        Origin: "https://attacker.example.test",
        "Sec-Fetch-Site": "same-site",
      },
      method: "POST",
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({
      code: "FORBIDDEN_ORIGIN",
      message: "Forbidden",
    })
    expect(authHandler).not.toHaveBeenCalled()
  })

  it("주입한 capability route에 관리자 인증과 actor 로깅을 적용한다", async () => {
    const requestEvents: unknown[] = []
    const securityEvents: unknown[] = []
    const app = createFixture({
      requestLogger(event) {
        requestEvents.push(event)
      },
      requestLoggingRuntime: {
        createRequestId: () => "admin-request-id",
        readMonotonicTimeMs: () => 0,
      },
      securityAuditLogger(event) {
        securityEvents.push(event)
      },
      registerRoutes(app, sessionResolver) {
        const ownerRoute = createRoute({
          method: "post",
          operationId: "runAdminOwnerAction",
          path: "/owner-action",
          responses: {
            200: jsonResponse(
              "관리자 소유자 작업 결과입니다.",
              z.object({ ok: z.boolean() })
            ),
          },
          ...adminSessionRouteOptions(sessionResolver),
        })
        app.openapi(ownerRoute, (context) => context.json({ ok: true }, 200))
      },
    })

    const response = await app.request("/owner-action", {
      headers: {
        Cookie: `${adminSessionCookieName}=admin-token`,
        Origin: adminOrigin,
      },
      method: "POST",
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(response.headers.get("x-request-id")).toBe("admin-request-id")
    expect(requestEvents).toEqual([
      expect.objectContaining({
        actorId: "admin-1",
        actorType: "admin",
        audience: "admin",
        method: "POST",
        path: "/owner-action",
        requestId: "admin-request-id",
        status: 200,
      }),
    ])
    expect(securityEvents).toEqual([
      expect.objectContaining({
        action: "owner.mutation",
        actorId: "admin-1",
        actorType: "admin",
        outcome: "succeeded",
      }),
    ])
  })

  it("내부 예외를 redacted 500 오류와 request id로 변환한다", async () => {
    const errors: unknown[] = []
    const app = createFixture({
      errorLogger(event) {
        errors.push(event)
      },
      registerRoutes(app) {
        const failingRoute = createRoute({
          method: "get",
          operationId: "getFailingAdminFixture",
          path: "/failure",
          responses: {
            200: { description: "실패 fixture입니다." },
          },
        })
        app.openapi(failingRoute, () => {
          throw new Error("database unavailable sentinel")
        })
      },
      requestLogger() {},
      requestLoggingRuntime: {
        createRequestId: () => "admin-error-request-id",
        readMonotonicTimeMs: () => 0,
      },
    })

    const response = await app.request("/failure")

    expect(response.status).toBe(500)
    expect(response.headers.get("x-request-id")).toBe("admin-error-request-id")
    expect(errors).toEqual([
      expect.objectContaining({
        errorClass: "Error",
        requestId: "admin-error-request-id",
        status: 500,
      }),
    ])
    expect(JSON.stringify(errors)).not.toContain(
      "database unavailable sentinel"
    )
    await expect(response.json()).resolves.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
      requestId: "admin-error-request-id",
    })
  })

  it("OpenAPI 문서에 실제 관리자 cookie와 foundation 보안 계약을 등록한다", async () => {
    const app = createFixture()

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
      ["paths", "/api/admin/session", "get", "security"],
      [{ adminSessionCookie: [] }]
    )
  })

  it("한 app에 추가한 route가 다른 app instance를 오염시키지 않는다", async () => {
    const first = createFixture()
    const second = createFixture()

    first.get("/fixture", (context) => context.text("first"))
    second.get("/fixture", (context) => context.text("second"))

    await expect(
      Promise.resolve(first.request("/fixture")).then((response) =>
        response.text()
      )
    ).resolves.toBe("first")
    await expect(
      Promise.resolve(second.request("/fixture")).then((response) =>
        response.text()
      )
    ).resolves.toBe("second")
  })
})

type AdminTestOptions = Partial<AdminAppDependencies> & {
  readonly authHandler?: (request: Request) => Promise<Response>
  readonly health?: { readonly isDatabaseReady: () => boolean }
  readonly registerRoutes?: (
    app: OpenAPIHono<AdminHonoEnv>,
    sessionResolver: AdminSessionResolver
  ) => void
  readonly sessionResolver?: AdminSessionResolver
}

function createFixture(overrides: AdminTestOptions = {}) {
  const session = createSession()
  const sessionResolver =
    overrides.sessionResolver ??
    ({
      async resolveSession(headers) {
        return headers.get("Cookie")?.includes(adminSessionCookieName)
          ? session
          : null
      },
    } satisfies AdminSessionResolver)
  const {
    authHandler,
    health = { isDatabaseReady: () => true },
    registerRoutes,
    sessionResolver: _sessionResolver,
    ...appDependencies
  } = overrides
  const app = createAdminApp({
    adminOrigin,
    ...appDependencies,
  })

  registerAdminFoundationRoutes(app, { health, sessionResolver })
  registerRoutes?.(app, sessionResolver)
  registerAdminAuthRoutes(app, authHandler)
  registerAdminApiDocumentation(app, { enabled: true })
  return app
}

function createSession(): AdminAuthenticatedSession {
  return {
    admin: {
      email: "admin@example.com",
      id: adminId,
      name: "관리자",
    },
    [adminSessionExpiresAt]: new Date("2026-07-18T00:00:00.000Z"),
  }
}
