import { describe, expect, it, vi } from "vitest"
import { adminIdSchema } from "@workspace/contracts/admin"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { adminRoles } from "@workspace/core/admin"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import { z } from "@/http/platform/zod"

import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
} from "@workspace/auth/admin/server"
import { defineAdminRoute } from "@/admin/admin-hono-env"
import { jsonResponse } from "@/admin/admin-openapi"
import { ownerAdminRouteOptions } from "@/admin/admin-route-options"
import { createAdminApp, type AdminAppDependencies } from "@/http/admin-app"
import { defineAdminRouteGroup } from "@/http/admin-route-group"

const adminId = adminIdSchema.parse("admin-1")
const adminOrigin = localRuntimeDefaults.adminWebOrigin

describe("통합 runtime 관리자 공통 delivery", () => {
  it("기능 route가 비어 있어도 health, session, OpenAPI 기반이 독립 실행된다", async () => {
    const app = createAdminApp(createDependencies())

    const healthResponse = await app.request("/health")
    const sessionResponse = await app.request("/session")
    const openApiResponse = await app.request("/openapi")
    const featureResponse = await app.request("/courses")

    expect(healthResponse.status).toBe(200)
    await expect(healthResponse.json()).resolves.toEqual({
      ok: true,
      service: "api",
    })
    expect(sessionResponse.status).toBe(401)
    await expect(sessionResponse.json()).resolves.toEqual({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
    expect(openApiResponse.status).toBe(200)
    expect(featureResponse.status).toBe(404)
  })

  it("관리자 세션 응답과 auth 응답에 private no-store를 적용한다", async () => {
    const authHandler = vi.fn(async () => Response.json({ ok: true }))
    const app = createAdminApp(
      createDependencies({
        authHandler,
      })
    )

    const sessionResponse = await app.request("/session", {
      headers: {
        Cookie: `${adminSessionCookieName}=admin-token`,
      },
    })
    const authResponse = await app.request("/auth/get-session")

    expect(sessionResponse.status).toBe(200)
    expect(sessionResponse.headers.get("Cache-Control")).toBe(
      "private, no-store"
    )
    expect(sessionResponse.headers.get("Vary")).toContain("Cookie")
    await expect(sessionResponse.json()).resolves.toEqual({
      admin: {
        email: "admin@example.com",
        id: "admin-1",
        name: "관리자",
        role: "owner",
      },
    })
    expect(authResponse.status).toBe(200)
    expect(authResponse.headers.get("Cache-Control")).toBe("private, no-store")
    expect(authResponse.headers.get("Vary")).toContain("Cookie")
    expect(authHandler).toHaveBeenCalledOnce()
  })

  it("health와 OpenAPI 공개 응답에는 private cache 정책을 추가하지 않는다", async () => {
    const app = createAdminApp(createDependencies())

    for (const path of ["/health", "/openapi"]) {
      const response = await app.request(path)

      expect(response.status).toBe(200)
      expect(response.headers.get("Cache-Control")).not.toBe(
        "private, no-store"
      )
    }
  })

  it("관리자 비밀번호 변경은 요청값과 무관하게 다른 세션 폐기를 강제한다", async () => {
    const capturedRequests: Request[] = []
    const app = createAdminApp(
      createDependencies({
        async authHandler(request) {
          capturedRequests.push(request)

          return Response.json({ ok: true })
        },
      })
    )

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
    const app = createAdminApp(createDependencies({ authHandler }))

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
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN_ORIGIN",
      message: "Forbidden",
    })
    expect(authHandler).not.toHaveBeenCalled()
  })

  it("관리자 API 본문은 6 MiB까지 전달하고 1 byte 초과는 handler 전에 거절한다", async () => {
    const authHandler = vi.fn(async () => Response.json({ ok: true }))
    const app = createAdminApp(createDependencies({ authHandler }))
    const bodyLimitBytes = 6 * 1024 * 1024

    for (const fixture of [
      { expectedStatus: 200, size: bodyLimitBytes },
      { expectedStatus: 413, size: bodyLimitBytes + 1 },
    ] as const) {
      const response = await app.request("/auth/test", {
        body: "x".repeat(fixture.size),
        headers: {
          "Content-Length": String(fixture.size),
          "Content-Type": "text/plain",
        },
        method: "POST",
      })

      expect(response.status).toBe(fixture.expectedStatus)
    }

    expect(authHandler).toHaveBeenCalledOnce()
  })

  it("관리자 CORS preflight 계약을 유지한다", async () => {
    const app = createAdminApp(createDependencies())

    const response = await app.request("/session", {
      headers: {
        "Access-Control-Request-Headers": "Authorization, Content-Type",
        "Access-Control-Request-Method": "PUT",
        Origin: adminOrigin,
      },
      method: "OPTIONS",
    })

    expect(response.status).toBe(204)
    expect(response.headers.get("access-control-allow-origin")).toBe(
      adminOrigin
    )
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true"
    )
    expect(response.headers.get("access-control-allow-methods")).toContain(
      "PUT"
    )
    expect(response.headers.get("access-control-expose-headers")).toContain(
      "Content-Disposition"
    )
  })

  it("주입한 capability route에 owner 인가와 관리자 actor 로깅을 적용한다", async () => {
    const requestEvents: unknown[] = []
    const securityEvents: unknown[] = []
    const dependencies = createDependencies({
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
    })
    const ownerRoute = defineAdminRoute({
      method: "post",
      operationId: "runAdminOwnerAction",
      path: "/owner-action",
      responses: {
        200: jsonResponse(
          "관리자 소유자 작업 결과입니다.",
          z.object({ ok: z.boolean() })
        ),
      },
      handler: (context) => context.json({ ok: true }, 200),
      ...ownerAdminRouteOptions(dependencies.sessionResolver),
    })
    const app = createAdminApp({
      ...dependencies,
      capabilityRoutes: defineAdminRouteGroup([ownerRoute]),
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

  it("operator는 주입된 owner route에서 기존 403 의미를 유지한다", async () => {
    const dependencies = createDependencies({ role: adminRoles.operator })
    const ownerRoute = defineAdminRoute({
      method: "post",
      operationId: "runOwnerOnlyAction",
      path: "/owner-only",
      responses: {
        200: { description: "소유자 작업 결과입니다." },
      },
      handler: (context) => context.json({ ok: true }, 200),
      ...ownerAdminRouteOptions(dependencies.sessionResolver),
    })
    const app = createAdminApp({
      ...dependencies,
      capabilityRoutes: defineAdminRouteGroup([ownerRoute]),
    })

    const response = await app.request("/owner-only", {
      headers: {
        Cookie: `${adminSessionCookieName}=admin-token`,
        Origin: adminOrigin,
      },
      method: "POST",
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: "FORBIDDEN",
      message: "Forbidden",
    })
  })

  it("내부 예외를 redacted 500 오류와 request id로 변환한다", async () => {
    const errors: unknown[] = []
    const failingRoute = defineAdminRoute({
      method: "get",
      operationId: "getFailingAdminFixture",
      path: "/failure",
      responses: {
        200: { description: "실패 fixture입니다." },
      },
      handler: () => {
        throw new Error("database unavailable sentinel")
      },
    })
    const app = createAdminApp(
      createDependencies({
        capabilityRoutes: defineAdminRouteGroup([failingRoute]),
        errorLogger(event) {
          errors.push(event)
        },
        requestLogger() {},
        requestLoggingRuntime: {
          createRequestId: () => "admin-error-request-id",
          readMonotonicTimeMs: () => 0,
        },
      })
    )

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
    await expect(response.json()).resolves.toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
    })
  })

  it("OpenAPI 문서에 실제 관리자 cookie와 foundation 보안 계약을 등록한다", async () => {
    const app = createAdminApp(createDependencies())

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

  it("각 factory 호출은 route registry와 middleware 상태를 공유하지 않는다", async () => {
    const first = createAdminApp(createDependencies())
    const second = createAdminApp(createDependencies())

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

function createDependencies(
  overrides: Partial<AdminAppDependencies> & {
    readonly role?: AdminAuthenticatedSession["admin"]["role"]
  } = {}
): AdminAppDependencies {
  const session = createSession(overrides.role ?? adminRoles.owner)

  return {
    adminOrigin,
    sessionResolver: {
      async resolveSession(headers) {
        return headers.get("Cookie")?.includes(adminSessionCookieName)
          ? session
          : null
      },
    },
    ...overrides,
  }
}

function createSession(
  role: AdminAuthenticatedSession["admin"]["role"]
): AdminAuthenticatedSession {
  return {
    admin: {
      email: "admin@example.com",
      id: adminId,
      name: "관리자",
      role,
    },
    [adminSessionExpiresAt]: new Date("2026-07-18T00:00:00.000Z"),
  }
}
