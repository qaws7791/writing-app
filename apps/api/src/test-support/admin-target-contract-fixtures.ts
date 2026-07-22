import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { adminRoles } from "@workspace/identity/admin-actor"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import { z } from "@workspace/http-platform/zod"

import {
  adminSessionExpiresAt,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@workspace/identity/sessions"
import { defineAdminRoute } from "@/admin/admin-hono-env"
import { jsonResponse } from "@/admin/admin-openapi"
import { ownerAdminRouteOptions } from "@workspace/identity/http"
import { createAdminApp } from "@/http/admin-app"
import { defineAdminRouteGroup } from "@/http/admin-route-group"
import { createAdminContentTargetRouteFixture } from "@/test-support/admin-content-target-route-fixture"
import { createAdminIdentityTargetRouteFixture } from "@/test-support/admin-identity-target-route-fixture"
import { createAdminResourceLibraryTargetRouteFixture } from "@/test-support/admin-resource-library-target-route-fixture"
import type {
  AdminTargetRouteFixture as AdminTargetContractFixture,
  AdminTargetRouteFixtureJson as AdminTargetContractFixtureJson,
} from "@/test-support/admin-target-route-fixture"

export type AdminTargetContractFixtureFactory = (
  scenario: string
) => AdminTargetContractFixture

export const adminTargetContractFixtureFactories: Readonly<
  Record<string, AdminTargetContractFixtureFactory>
> = {
  "admin-content": createAdminContentTargetRouteFixture,
  "admin-foundation": createAdminFoundationFixture,
  "admin-identity": createAdminIdentityTargetRouteFixture,
  "admin-resource-library": createAdminResourceLibraryTargetRouteFixture,
  "harness-self-test": createHarnessSelfTestFixture,
  "harness-timeout-self-test": createHarnessTimeoutSelfTestFixture,
}

function createAdminFoundationFixture(
  scenario: string
): AdminTargetContractFixture {
  const sessionResolver = createAdminFoundationSessionResolver(scenario)
  const journal = createEffectJournal()
  const app = createAdminApp({
    adminOrigin: localRuntimeDefaults.adminWebOrigin,
    async authHandler(request) {
      journal.record("auth.handler", {
        body: await readRequestBodyForJournal(request),
        method: request.method,
        path: new URL(request.url).pathname,
      })

      if (new URL(request.url).pathname === "/auth/failure") {
        throw new Error("admin foundation target contract sentinel")
      }

      return Response.json({ ok: true })
    },
    capabilityRoutes: defineAdminRouteGroup([
      createAdminFoundationOwnerRoute(sessionResolver),
    ]),
    requestLogger(event) {
      journal.record("request.completed", {
        actorId: event.actorId ?? null,
        actorType: event.actorType ?? null,
        durationMs: event.durationMs,
        externalRequestId: event.externalRequestId ?? null,
        method: event.method,
        path: event.path,
        requestId: event.requestId,
        status: event.status,
      })
    },
    requestLoggingRuntime: {
      createRequestId: () => "admin-target-contract-request-id",
      readMonotonicTimeMs: () => 0,
    },
    securityAuditLogger(event) {
      journal.record("security.audit", {
        action: event.action,
        actorId: event.actorId ?? null,
        actorType: event.actorType ?? null,
        outcome: event.outcome,
        reason: event.reason ?? null,
        requestId: event.requestId,
        target: event.target,
      })
    },
    sessionResolver,
  })

  return {
    fetch(request) {
      return app.fetch(request)
    },
    readEffectJournal() {
      return journal.read()
    },
  }
}

function createAdminFoundationOwnerRoute(
  sessionResolver: AdminSessionResolver
) {
  return defineAdminRoute({
    method: "post",
    operationId: "runAdminFoundationOwnerAction",
    path: "/target-contract-owner-action",
    responses: {
      200: jsonResponse(
        "관리자 공통 delivery target 계약 소유자 작업입니다.",
        z.object({ ok: z.literal(true) })
      ),
    },
    summary: "관리자 공통 delivery target 계약 소유자 작업",
    handler: (context) => context.json({ ok: true }, 200),
    ...ownerAdminRouteOptions(sessionResolver),
  })
}

function createAdminFoundationSessionResolver(
  scenario: string
): AdminSessionResolver {
  const role = readAdminFoundationRole(scenario)
  const session = {
    admin: {
      email: "admin@example.com",
      id: adminIdSchema.parse("admin-1"),
      name: "관리자",
      role,
    },
    [adminSessionExpiresAt]: new Date("2099-01-01T00:00:00.000Z"),
  } as const satisfies AdminAuthenticatedSession

  return {
    async resolveSession(headers) {
      return readAdminSessionToken(headers) === "admin-token" ? session : null
    },
  }
}

function readAdminFoundationRole(scenario: string) {
  if (scenario === "default") return adminRoles.owner
  if (scenario === "operator") return adminRoles.operator

  throw new Error(
    `지원하지 않는 target admin foundation scenario입니다: ${scenario}`
  )
}

function readAdminSessionToken(headers: Headers): string | null {
  const cookies = headers.get("Cookie")
  if (cookies === null) return null

  const token = cookies
    .split(";")
    .map((cookie) => cookie.trim().split("=", 2))
    .find(([name]) => name === adminSessionCookieName)?.[1]

  return token === undefined ? null : decodeURIComponent(token)
}

function createEffectJournal() {
  const entries: AdminTargetContractFixtureJson[] = []
  let sequence = 0

  return {
    record(effect: string, input: AdminTargetContractFixtureJson) {
      sequence += 1
      entries.push({ effect, input, sequence })
    },
    read() {
      return entries
    },
  }
}

async function readRequestBodyForJournal(
  request: Request
): Promise<AdminTargetContractFixtureJson> {
  const body = await request.text()
  if (body.length === 0) return null

  try {
    return assertJson(JSON.parse(body))
  } catch {
    return body
  }
}

function createHarnessTimeoutSelfTestFixture(
  scenario: string
): AdminTargetContractFixture {
  assertDefaultScenario(scenario)

  return {
    fetch() {
      return new Promise<Response>(() => {
        setInterval(() => undefined, 1_000)
      })
    },
    readEffectJournal() {
      return []
    },
  }
}

function createHarnessSelfTestFixture(
  scenario: string
): AdminTargetContractFixture {
  assertDefaultScenario(scenario)
  const effectJournal: AdminTargetContractFixtureJson[] = []

  return {
    async fetch(request) {
      const path = new URL(request.url).pathname

      if (path === "/fixture/json") {
        return createJsonResponse(
          '{"items":[{"active":true,"id":"item-1"}],"nested":{"first":1,"second":2},"message":"동일한 응답"}'
        )
      }
      if (path === "/fixture/openapi") {
        return createJsonResponse(
          '{"components":{"securitySchemes":{"adminSessionCookie":{"name":"admin_session_token","in":"cookie","type":"apiKey"}}},"paths":{"/fixture/effects":{"post":{"responses":{"202":{"description":"accepted"}},"operationId":"recordFixtureEffect"}},"/target-only":{"get":{"responses":{"200":{"description":"target"}},"operationId":"targetOnly"}}},"info":{"version":"1.0.0","title":"관리자 target contract fixture"},"openapi":"3.1.0"}'
        )
      }
      if (path === "/fixture/openapi-mismatch") {
        return createJsonResponse(
          '{"paths":{"/fixture/effects":{"post":{"responses":{"202":{"description":"accepted"}},"operationId":"targetRecordFixtureEffect"}}},"info":{"version":"1.0.0","title":"관리자 target contract fixture"},"openapi":"3.1.0"}'
        )
      }
      if (path === "/fixture/sse") {
        return new Response(
          ': target serialization\r\nevent: chunk\r\nretry: 1500\r\ndata: {"index":1,"delta":"첫째"}\r\nid: event-1\r\n\r\ndata: {"conversationId":"chat-1","message":{"role":"assistant","id":"message-1"}}\r\nevent: done\r\n\r\n',
          {
            headers: createResponseHeaders("text/event-stream; charset=UTF-8"),
          }
        )
      }
      if (path === "/fixture/effects" && request.method === "POST") {
        const input: unknown = await request.json()
        effectJournal.push({
          sequence: 1,
          input: assertJson(input),
          effect: "fixture.saved",
        })

        return createJsonResponse(
          '{"resourceId":"fixture-1","accepted":true}',
          202
        )
      }
      if (path === "/fixture/text") {
        return new Response("관리자 target contract 텍스트", {
          headers: createResponseHeaders("text/plain; charset=UTF-8"),
        })
      }
      if (path === "/fixture/bytes") {
        return new Response(Uint8Array.from([0, 255, 1, 128]), {
          headers: createResponseHeaders("application/octet-stream"),
        })
      }
      if (path === "/fixture/none") {
        return new Response(null, {
          headers: createResponseHeaders(),
          status: 204,
        })
      }

      return createJsonResponse('{"code":"NOT_FOUND"}', 404)
    },
    readEffectJournal() {
      return effectJournal
    },
  }
}

function createJsonResponse(body: string, status = 200): Response {
  return new Response(body, {
    headers: createResponseHeaders("application/json; charset=UTF-8"),
    status,
  })
}

function createResponseHeaders(contentType?: string): Headers {
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "X-Target-Contract": "semantic-v1",
  })

  if (contentType !== undefined) headers.set("Content-Type", contentType)
  return headers
}

function assertDefaultScenario(scenario: string): void {
  if (scenario !== "default") {
    throw new Error(
      `지원하지 않는 target target contract scenario입니다: ${scenario}`
    )
  }
}

function assertJson(value: unknown): AdminTargetContractFixtureJson {
  JSON.stringify(value)

  if (value === undefined) {
    throw new Error("effect input은 JSON 값이어야 합니다.")
  }

  return value as AdminTargetContractFixtureJson
}
