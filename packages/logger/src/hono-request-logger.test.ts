import { Hono } from "hono"
import { describe, expect, it, vi } from "vitest"

import { createRequestLoggingMiddleware } from "@/hono-request-logger"
import type { RequestLogEvent } from "@/request-logger"

describe("Hono request logging middleware", () => {
  it("기존 x-request-id를 보존하고 주입된 monotonic clock으로 duration을 계산한다", async () => {
    const events: RequestLogEvent[] = []
    const createRequestId = vi.fn(() => "generated-request-id")
    const readMonotonicTimeMs = createMonotonicClock([10.2, 18.8])
    const app = new Hono()

    app.use(
      "*",
      createRequestLoggingMiddleware({
        createRequestId,
        logRequest: (event) => events.push(event),
        readMonotonicTimeMs,
      })
    )
    app.get("/health", (context) => context.text("ok", 202))

    const response = await app.request("/health", {
      headers: {
        "x-request-id": "incoming-request-id",
      },
    })

    expect(response.headers.get("x-request-id")).toBe("incoming-request-id")
    expect(createRequestId).not.toHaveBeenCalled()
    expect(events).toEqual([
      {
        durationMs: 9,
        method: "GET",
        path: "/health",
        requestId: "incoming-request-id",
        status: 202,
      },
    ])
  })

  it("request id가 없으면 주입된 generator로 새 id를 만들고 response header에 싣는다", async () => {
    const events: RequestLogEvent[] = []
    const app = new Hono()

    app.use(
      "*",
      createRequestLoggingMiddleware({
        createRequestId: () => "generated-request-id",
        logRequest: (event) => events.push(event),
        readMonotonicTimeMs: createMonotonicClock([1, 1]),
      })
    )
    app.get("/courses", (context) => context.json({ ok: true }))

    const response = await app.request("/courses")

    expect(response.headers.get("x-request-id")).toBe("generated-request-id")
    expect(events[0]).toMatchObject({
      durationMs: 0,
      method: "GET",
      path: "/courses",
      requestId: "generated-request-id",
      status: 200,
    })
  })

  it("route가 예외를 던져도 finally에서 요청 로그를 남긴다", async () => {
    const events: RequestLogEvent[] = []
    const app = new Hono()

    app.onError((_error, context) => context.text("failed", 500))
    app.use(
      "*",
      createRequestLoggingMiddleware({
        createRequestId: () => "failed-request-id",
        logRequest: (event) => events.push(event),
        readMonotonicTimeMs: createMonotonicClock([2, 7]),
      })
    )
    app.get("/boom", () => {
      throw new Error("boom")
    })

    const response = await app.request("/boom")

    expect(response.status).toBe(500)
    expect(events).toEqual([
      {
        durationMs: 5,
        method: "GET",
        path: "/boom",
        requestId: "failed-request-id",
        status: 500,
      },
    ])
  })
})

function createMonotonicClock(values: readonly number[]): () => number {
  let index = 0

  return () => {
    const value = values[index]

    if (value === undefined) {
      throw new Error("No monotonic clock value is available")
    }

    index += 1
    return value
  }
}
