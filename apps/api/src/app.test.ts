import { afterEach, describe, expect, test } from "vitest"
import { APIError } from "better-auth/api"

import { createTestApi } from "./test-support/create-test-app.js"
import { createCapturedLogger } from "./test-support/capture-logger.js"

const createdApps: Array<ReturnType<typeof createTestApi>> = []

afterEach(() => {
  while (createdApps.length > 0) {
    createdApps.pop()?.close()
  }
})

function setup() {
  const api = createTestApi()
  createdApps.push(api)
  return api
}

async function readJson<TResponse>(response: Response): Promise<TResponse> {
  return (await response.json()) as TResponse
}

describe("health", () => {
  test("reports server status", async () => {
    const { app } = setup()
    const response = await app.request("/health")
    const body = await readJson<{
      ai: { status: string }
      db: { latencyMs: number | null; status: string }
      status: string
    }>(response)

    expect(response.status).toBe(200)
    expect(body.status).toBe("ok")
    expect(body.db.status).toBe("ok")
    expect(body.db.latencyMs).toEqual(expect.any(Number))
    expect(body.ai.status).toBe("degraded")
  })

  test("allows the local web origin through cors", async () => {
    const { app } = setup()
    const response = await app.request("/health", {
      headers: {
        origin: "http://127.0.0.1:3000",
      },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://127.0.0.1:3000"
    )
  })
})

describe("home", () => {
  test("returns first sentence loop entry points", async () => {
    const { app } = setup()
    const response = await app.request("/home")
    const body = await readJson<{
      startActions: Array<{ id: string }>
      garden: { cardCount: number; sentenceCount: number }
    }>(response)

    expect(response.status).toBe(200)
    expect(body.startActions.map((action) => action.id)).toEqual([
      "photo",
      "manual",
      "garden",
    ])
    expect(body.garden).toEqual({ cardCount: 0, sentenceCount: 0 })
  })
})

describe("users", () => {
  test("returns profile without removed journey or writing counters", async () => {
    const { app } = setup()
    const response = await app.request("/users/profile")
    const body = await readJson<{
      email: string
      gardenCardCount: number
      sentenceCount: number
    }>(response)

    expect(response.status).toBe(200)
    expect(body.email).toBe("dev-user@example.com")
    expect(body.gardenCardCount).toBe(0)
    expect(body.sentenceCount).toBe(0)
  })
})

describe("fallbacks", () => {
  test("returns not found for unsupported routes", async () => {
    const { app } = setup()
    const response = await app.request("/unknown")
    const body = await readJson<{ error: { code: string } }>(response)

    expect(response.status).toBe(404)
    expect(body.error.code).toBe("not_found")
  })
})

describe("logging", () => {
  test("logs request lifecycle and reuses request ids", async () => {
    const { entries, logger } = createCapturedLogger()
    const api = createTestApi({ logger })
    createdApps.push(api)

    const response = await api.app.request("/health", {
      headers: { "x-request-id": "req-123" },
    })

    const started = entries.find((entry) => entry.msg === "request started")
    const completed = entries.find((entry) => entry.msg === "request completed")

    expect(response.status).toBe(200)
    expect(response.headers.get("x-request-id")).toBe("req-123")
    expect(started).toEqual(
      expect.objectContaining({
        level: 30,
        method: "GET",
        path: "/health",
        requestId: "req-123",
        scope: "http",
      })
    )
    expect(completed).toEqual(
      expect.objectContaining({
        level: 30,
        requestId: "req-123",
        status: 200,
      })
    )
    expect(completed?.durationMs).toEqual(expect.any(Number))
  })

  test("logs 401 unauthorized errors through the shared application status map", async () => {
    const { entries, logger } = createCapturedLogger()
    const api = createTestApi({ logger })
    createdApps.push(api)

    const response = await api.app.request("/home", {
      headers: {
        "x-test-auth": "none",
      },
    })
    const failed = entries.find((entry) => entry.msg === "request failed")

    expect(response.status).toBe(401)
    expect(failed).toEqual(
      expect.objectContaining({
        code: "unauthorized",
        level: 40,
        status: 401,
      })
    )
  })

  test("maps better-auth api errors through the global error handler", async () => {
    const api = createTestApi({
      homeError: new APIError("CONFLICT", {
        message: "이미 가입된 이메일입니다.",
      }),
    })
    createdApps.push(api)

    const response = await api.app.request("/home")
    const body = await readJson<{ error: { code: string; message: string } }>(
      response
    )

    expect(response.status).toBe(409)
    expect(body.error).toEqual({
      code: "conflict",
      message: "이미 가입된 이메일입니다.",
    })
  })

  test("logs 5xx errors at error level", async () => {
    const { entries, logger } = createCapturedLogger()
    const api = createTestApi({
      homeError: new Error("boom"),
      logger,
    })
    createdApps.push(api)

    const response = await api.app.request("/home")
    const body = await readJson<{
      error: { code: string; requestId?: string }
    }>(response)
    const failed = entries.find((entry) => entry.msg === "request failed")

    expect(response.status).toBe(500)
    expect(body.error.code).toBe("internal_error")
    expect(body.error.requestId).toEqual(expect.any(String))
    expect(failed).toEqual(
      expect.objectContaining({
        code: "internal_error",
        level: 50,
        status: 500,
      })
    )
  })

  test("serves the openapi document without removed route paths", async () => {
    const { entries, logger } = createCapturedLogger()
    const api = createTestApi({ logger })
    createdApps.push(api)

    const response = await api.app.request("/openapi.json")
    const body = await readJson<{
      openapi: string
      paths?: Record<string, unknown>
    }>(response)
    const failed = entries.find(
      (entry) => entry.msg === "openapi document generation failed"
    )

    expect(response.status).toBe(200)
    expect(body.openapi).toBe("3.0.0")
    expect(body.paths).toHaveProperty("/home")
    expect(body.paths).toHaveProperty("/users/profile")
    expect(body.paths).not.toHaveProperty("/writings")
    expect(body.paths).not.toHaveProperty("/journeys")
    expect(body.paths).not.toHaveProperty("/prompts")
    expect(body.paths).not.toHaveProperty("/sessions/{sessionId}")
    expect(body.paths).not.toHaveProperty("/ai/feedback")
    expect(failed).toBeUndefined()
  })
})
