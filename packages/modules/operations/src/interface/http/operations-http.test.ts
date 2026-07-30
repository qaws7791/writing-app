import { describe, expect, it } from "vitest"
import { createApp } from "@workspace/http-platform/app"
import { err, ok } from "@workspace/kernel/result"
import type { AdminId } from "@workspace/types/ids"

import type { OperationsActor } from "#operations/domain/operations-actor"
import {
  registerOperationsRoutes,
  type OperationsHonoEnv,
} from "#operations/interface/http/operations-http"

const adminId = "admin-1" as AdminId
const now = new Date("2026-07-23T00:00:00.000Z")
const cookie = "admin_session_token=admin-token"

describe("operations HTTP contract", () => {
  it("인증 없는 요청을 거절하고 인증된 read에는 private no-store를 적용한다", async () => {
    const app = createFixture()
    const anonymous = await app.request("/dashboard")
    const authenticated = await app.request("/dashboard", {
      headers: { Cookie: cookie },
    })

    expect(anonymous.status).toBe(401)
    await expect(anonymous.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    })
    expect(authenticated.status).toBe(200)
    expect(authenticated.headers.get("Cache-Control")).toBe("private, no-store")
  })

  it("부분 reporting 실패를 불완전한 성공으로 숨기지 않고 503으로 공개한다", async () => {
    const app = createFixture({ reportingUnavailable: true })
    const response = await app.request("/dashboard", {
      headers: { Cookie: cookie },
    })

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      code: "OPERATIONS_REPORTING_UNAVAILABLE",
    })
  })

  it.each([
    {
      case: "레슨 pageSize 상한을 넘기면",
      path: "/analytics/lessons?pageSize=101",
    },
    {
      case: "허용하지 않은 정렬 key를 주면",
      path: "/analytics/lessons?sort=started",
    },
    {
      case: "AI 품질 조회 기간이 허용 범위를 넘기면",
      path: "/analytics/ai-feedback?from=2025-01-01T00%3A00%3A00.000Z&to=2026-07-23T00%3A00%3A00.000Z",
    },
  ])(
    "$case route 경계에서 400 VALIDATION_FAILED로 거절한다",
    async ({ path }) => {
      const app = createFixture()

      const response = await app.request(path, {
        headers: { Cookie: cookie },
      })

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toMatchObject({
        code: "VALIDATION_FAILED",
      })
    }
  )

  it("레슨 pageSize 상한 100은 거절하지 않고 조회를 허용한다", async () => {
    const app = createFixture()

    const response = await app.request("/analytics/lessons?pageSize=100", {
      headers: { Cookie: cookie },
    })

    expect(response.status).toBe(200)
  })

  it("AI 품질 집계는 관리자 전용 private no-store 응답으로 제공한다", async () => {
    const app = createFixture()
    const response = await app.request(
      "/analytics/ai-feedback?from=2026-07-22T00%3A00%3A00.000Z&to=2026-07-23T00%3A00%3A00.000Z",
      { headers: { Cookie: cookie } }
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
  })

  it("분석 요약은 관리자 전용 private no-store 응답으로 제공한다", async () => {
    const app = createFixture()
    const response = await app.request("/analytics?days=30", {
      headers: { Cookie: cookie },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
  })

  it("감사 이벤트 조회를 관리자 전용 private 응답으로 제공한다", async () => {
    const app = createFixture()
    const authenticated = await app.request("/audit-events?limit=10", {
      headers: { Cookie: cookie },
    })

    expect(authenticated.status).toBe(200)
    expect(authenticated.headers.get("Cache-Control")).toBe("private, no-store")
    await expect(authenticated.json()).resolves.toEqual({ items: [] })
  })
})

function createFixture(
  input: Readonly<{ reportingUnavailable?: boolean }> = {}
) {
  const actor: OperationsActor = {
    id: adminId,
  }
  const app = createApp<OperationsHonoEnv>({
    middleware: [
      async (context, next) => {
        context.set("requestId", "request-1")
        await next()
      },
    ],
  })
  registerOperationsRoutes(app, {
    auditTrail: {
      async begin() {
        throw new Error("HTTP 조회 fixture에서 begin을 호출하면 안 됩니다.")
      },
      async complete() {
        throw new Error("HTTP 조회 fixture에서 complete를 호출하면 안 됩니다.")
      },
      async inspectExpired() {
        return ok(0)
      },
      async purgeExpired() {
        return ok(0)
      },
      async readRecent() {
        return ok([])
      },
    },
    now: () => now,
    reporting: {
      readAiFeedbackQuality: async ({ from, to }) =>
        ok({
          failureCount: 0,
          failureCounts: [],
          from: from.toISOString(),
          latency: { averageMs: null, sampleCount: 0, totalMs: 0 },
          requestCount: 0,
          retryCount: 0,
          status: "empty",
          successCount: 0,
          successRate: null,
          to: to.toISOString(),
          tokens: { input: 0, output: 0, sampleCount: 0 },
        }),
      readAnalytics: async () =>
        ok({
          dailySeries: [],
          from: "2026-06-24",
          matureCohortThrough: "2026-07-15",
          to: "2026-07-23",
          worstAiFeedbackLessons: [],
          worstLessons: [],
        }),
      readDashboard: async () =>
        input.reportingUnavailable === true
          ? err({ kind: "reporting-unavailable", query: "dashboard" })
          : ok({
              activeWindow: { from: "2026-07-17", to: "2026-07-23" },
              asOfDate: "2026-07-23",
              metrics: {
                activeUsersLast7Days: 0,
                activationRate: {
                  denominator: 0,
                  numerator: 0,
                  percentage: null,
                  status: "empty",
                },
                completedLessons: 0,
                d7ReturnRate: {
                  denominator: 0,
                  matureCohortThrough: "2026-07-15",
                  numerator: 0,
                  percentage: null,
                  status: "empty",
                },
                firstLessonStarts: 0,
                totalUsers: 0,
              },
            }),
      readLessonAnalytics: async () =>
        ok({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 }),
    },
    session: {
      async resolveActor(headers) {
        return headers.get("Cookie") === cookie ? actor : null
      },
    },
  })

  return app
}
