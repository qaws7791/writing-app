import { Hono } from "hono"
import { describe, expect, it, vi } from "vitest"

import {
  createRequestLoggingMiddleware,
  normalizeExternalRequestId,
} from "#http-platform/request-logging.middleware"
import type { RequestLogEvent } from "@workspace/observability/request-logger"
import type { HttpPlatformEnv } from "#http-platform/context"

describe("Hono request logging middleware", () => {
  it("외부 request id와 서버 request id를 분리한다", async () => {
    const events: RequestLogEvent[] = []
    const createRequestId = vi.fn(() => "generated-request-id")
    const readMonotonicTimeMs = createMonotonicClock([10.2, 18.8])
    const app = new Hono()

    app.use(
      "*",
      createRequestLoggingMiddleware({
        audience: "learner",
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

    expect(response.headers.get("x-request-id")).toBe("generated-request-id")
    expect(createRequestId).toHaveBeenCalledOnce()
    expect(events).toEqual([
      {
        audience: "learner",
        durationMs: 9,
        method: "GET",
        outcome: "succeeded",
        path: "/health",
        externalRequestId: "incoming-request-id",
        requestId: "generated-request-id",
        status: 202,
      },
    ])
  })

  it("초장문과 제어 문자가 있는 외부 request id는 로그에서 제외한다", async () => {
    const events: RequestLogEvent[] = []
    const app = new Hono()

    app.use(
      "*",
      createRequestLoggingMiddleware({
        audience: "learner",
        createRequestId: () => "server-request-id",
        logRequest: (event) => events.push(event),
      })
    )
    app.get("/health", (context) => context.text("ok"))

    await app.request("/health", {
      headers: { "x-request-id": "a".repeat(129) },
    })

    expect(events[0]).not.toHaveProperty("externalRequestId")
    expect(events[0]?.requestId).toBe("server-request-id")
    expect(normalizeExternalRequestId("line\nbreak")).toBeUndefined()
  })

  it("인증 middleware가 공통 context에 설정한 actor를 완료 로그에 보강한다", async () => {
    const events: RequestLogEvent[] = []
    const app = new Hono<HttpPlatformEnv>()

    app.use(
      "*",
      createRequestLoggingMiddleware({
        audience: "learner",
        createRequestId: () => "server-request-id",
        logRequest: (event) => events.push(event),
      })
    )
    app.use("*", async (context, next) => {
      context.set("requestActor", { id: "user-1", type: "learner" })
      await next()
    })
    app.get("/profile", (context) => context.text("ok"))

    await app.request("/profile")

    expect(events[0]).toMatchObject({
      actorId: "user-1",
      actorType: "learner",
      audience: "learner",
    })
  })

  it("실제 URL과 query 대신 매칭된 route template만 기록한다", async () => {
    const events: RequestLogEvent[] = []
    const app = new Hono()

    app.use(
      "*",
      createRequestLoggingMiddleware({
        audience: "learner",
        createRequestId: () => "route-template-request-id",
        logRequest: (event) => events.push(event),
      })
    )
    app.get("/users/:userId", (context) => context.text("ok"))

    await app.request("/users/private-user-id?token=query-secret")

    expect(events[0]).toMatchObject({
      path: "/users/:userId",
      requestId: "route-template-request-id",
    })
    expect(JSON.stringify(events[0])).not.toMatch(
      /private-user-id|query-secret/u
    )
  })

  it("같은 HTTP 요청에 middleware가 중첩되어도 완료 이벤트는 한 번만 기록한다", async () => {
    const firstLogger = vi.fn()
    const secondLogger = vi.fn()
    const app = new Hono()

    app.use(
      "*",
      createRequestLoggingMiddleware({
        audience: "learner",
        createRequestId: () => "single-request-id",
        logRequest: firstLogger,
      })
    )
    app.use(
      "*",
      createRequestLoggingMiddleware({
        audience: "learner",
        createRequestId: () => "duplicate-request-id",
        logRequest: secondLogger,
      })
    )
    app.get("/health", (context) => context.text("ok"))

    await app.request("/health")

    expect(firstLogger).toHaveBeenCalledOnce()
    expect(secondLogger).not.toHaveBeenCalled()
  })

  it("route가 예외를 던져도 finally에서 요청 로그를 남긴다", async () => {
    const events: RequestLogEvent[] = []
    const app = new Hono()

    app.onError((_error, context) => context.text("failed", 500))
    app.use(
      "*",
      createRequestLoggingMiddleware({
        audience: "learner",
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
        audience: "learner",
        durationMs: 5,
        errorClass: "server-error",
        method: "GET",
        outcome: "failed",
        path: "/boom",
        requestId: "failed-request-id",
        status: 500,
      },
    ])
  })

  it("4xx와 5xx를 실패 결과와 안정된 오류 분류로 구분한다", async () => {
    const events: RequestLogEvent[] = []
    const app = new Hono()
    app.use(
      "*",
      createRequestLoggingMiddleware({
        audience: "admin",
        createRequestId: () => "request-id",
        logRequest: (event) => events.push(event),
      })
    )
    app.get("/denied", (context) => context.text("denied", 403))
    app.get("/failed", (context) => context.text("failed", 503))

    await app.request("/denied")
    await app.request("/failed")

    expect(events).toEqual([
      expect.objectContaining({
        errorClass: "client-error",
        outcome: "failed",
        status: 403,
      }),
      expect.objectContaining({
        errorClass: "server-error",
        outcome: "failed",
        status: 503,
      }),
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
