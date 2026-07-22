import { Hono, type Env, type Schema } from "hono"
import { describe, expect, it, vi } from "vitest"

import { parseApiHostConfiguration } from "@/config/api-hosts"
import { createAdminApp } from "@/http/admin-app"
import { createLearnerApp } from "@/http/learner-app"
import { createUnifiedApp } from "@/http/unified-app"
import { createTestDependencies } from "@/routes/test-dependencies"

const allowedHosts = parseApiHostConfiguration("api.example.test,api:4000")

describe("단일 API app", () => {
  it("learner와 admin readiness는 같은 DB 상태를 반영하고 liveness와 분리한다", async () => {
    let databaseReady = false
    const health = { isDatabaseReady: () => databaseReady }
    const app = createUnifiedApp({
      adminApp: createAdminApp({
        health,
        sessionResolver: { resolveSession: () => Promise.resolve(null) },
      }),
      allowedHosts,
      learnerApp: createLearnerApp({
        ...createTestDependencies(),
        health,
      }),
    })

    for (const path of ["/health", "/api/admin/health"]) {
      expect((await request(app, path)).status).toBe(503)
    }
    for (const path of ["/health/live", "/api/admin/health/live"]) {
      expect((await request(app, path)).status).toBe(200)
    }

    databaseReady = true
    for (const path of ["/health", "/api/admin/health"]) {
      expect((await request(app, path)).status).toBe(200)
    }
  })

  it("learner 경로는 유지하고 관리자 경로만 /api/admin namespace로 격리한다", async () => {
    const learnerApp = new Hono().get("/courses", (context) =>
      context.text("learner")
    )
    const adminApp = new Hono().get("/courses", (context) =>
      context.text("admin")
    )
    const app = createUnifiedApp({ adminApp, allowedHosts, learnerApp })

    await expect(read(app, "/courses")).resolves.toBe("learner")
    await expect(read(app, "/api/admin/courses")).resolves.toBe("admin")
  })

  it("실제 관리자 foundation과 auth handler를 namespace 아래에만 공개한다", async () => {
    const authHandler = vi.fn(async () =>
      Response.json({ authenticated: false })
    )
    const app = createUnifiedApp({
      adminApp: createAdminApp({
        authHandler,
        sessionResolver: { resolveSession: () => Promise.resolve(null) },
      }),
      allowedHosts,
      learnerApp: new Hono(),
    })

    await expect(read(app, "/api/admin/health")).resolves.toBe(
      JSON.stringify({ ok: true, service: "api" })
    )
    await expect(read(app, "/api/admin/auth/get-session")).resolves.toBe(
      JSON.stringify({ authenticated: false })
    )
    expect(authHandler).toHaveBeenCalledTimes(1)
    expect((await request(app, "/health")).status).toBe(404)
  })

  it.each([
    ["missing", new Request("http://api.example.test/courses")],
    [
      "unknown",
      new Request("http://unknown.example.test/courses", {
        headers: { Host: "unknown.example.test" },
      }),
    ],
    [
      "mismatch",
      new Request("http://api.example.test/courses", {
        headers: { Host: "other.example.test" },
      }),
    ],
    [
      "invalid",
      new Request("http://api.example.test/courses", {
        headers: { Host: "*.example.test" },
      }),
    ],
  ] as const)("%s Host를 421로 거절한다", async (reason, request) => {
    const onRejectedHost = vi.fn()
    const app = createUnifiedApp({
      adminApp: new Hono(),
      allowedHosts,
      learnerApp: new Hono(),
      onRejectedHost,
    })

    const response = await app.fetch(request)

    expect(response.status).toBe(421)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/u)
    expect(onRejectedHost).toHaveBeenCalledWith({ reason })
  })
})

async function read<TEnv extends Env, TSchema extends Schema>(
  app: Hono<TEnv, TSchema>,
  path: string
): Promise<string> {
  const response = await request(app, path)

  return response.text()
}

function request<TEnv extends Env, TSchema extends Schema>(
  app: Hono<TEnv, TSchema>,
  path: string
): Promise<Response> | Response {
  return app.fetch(
    new Request(`http://api.example.test${path}`, {
      headers: { Host: "api.example.test" },
    })
  )
}
