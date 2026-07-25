import { Hono, type Env, type Schema } from "hono"
import { describe, expect, it, vi } from "vitest"

import { registerAdminFoundationRoutes } from "@/admin/admin-foundation.routes"
import { createAdminApp, registerAdminAuthRoutes } from "@/http/admin-app"
import { createUnifiedApp } from "@/http/unified-app"
import { createTestLearnerApp } from "@/routes/test-dependencies"

describe("단일 API app", () => {
  it("learner와 admin readiness는 같은 DB 상태를 반영하고 liveness와 분리한다", async () => {
    let databaseReady = false
    const health = { isDatabaseReady: () => databaseReady }
    const adminApp = createAdminApp({})
    registerAdminFoundationRoutes(adminApp, {
      health,
      sessionResolver: { resolveSession: () => Promise.resolve(null) },
    })
    const app = createUnifiedApp({
      adminApp,
      learnerApp: createTestLearnerApp({ health }),
    })

    for (const path of ["/api/health", "/api/admin/health"]) {
      const response = await request(app, path)
      expect(response.status).toBe(503)
      await expect(response.json()).resolves.toMatchObject({
        checks: { database: "unavailable" },
        impact: "database-dependent-requests-unavailable",
        ok: false,
      })
    }
    for (const path of ["/api/health/live", "/api/admin/health/live"]) {
      expect((await request(app, path)).status).toBe(200)
    }

    databaseReady = true
    for (const path of ["/api/health", "/api/admin/health"]) {
      const response = await request(app, path)
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toMatchObject({
        checks: { database: "ready" },
        impact: "none",
        ok: true,
      })
    }
  })

  it("learner와 admin 경로를 각 API namespace로 격리한다", async () => {
    const learnerApp = new Hono().get("/courses", (context) =>
      context.text("learner")
    )
    const adminApp = new Hono().get("/courses", (context) =>
      context.text("admin")
    )
    const app = createUnifiedApp({ adminApp, learnerApp })

    await expect(read(app, "/api/courses")).resolves.toBe("learner")
    await expect(read(app, "/api/admin/courses")).resolves.toBe("admin")
  })

  it("실제 관리자 foundation과 auth handler를 namespace 아래에만 공개한다", async () => {
    const authHandler = vi.fn(async () =>
      Response.json({ authenticated: false })
    )
    const adminApp = createAdminApp({})
    registerAdminFoundationRoutes(adminApp, {
      health: { isDatabaseReady: () => true },
      sessionResolver: { resolveSession: () => Promise.resolve(null) },
    })
    registerAdminAuthRoutes(adminApp, authHandler)
    const app = createUnifiedApp({
      adminApp,
      learnerApp: new Hono(),
    })

    expect((await request(app, "/api/admin/health")).status).toBe(200)
    await expect(read(app, "/api/admin/auth/get-session")).resolves.toBe(
      JSON.stringify({ authenticated: false })
    )
    expect(authHandler).toHaveBeenCalledTimes(1)
    expect((await request(app, "/health")).status).toBe(404)
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
