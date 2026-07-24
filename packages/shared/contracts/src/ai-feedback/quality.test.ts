import { describe, expect, it } from "vitest"

import {
  aiFeedbackQualityQuerySchema,
  aiFeedbackQualitySnapshotSchema,
} from "#contracts/ai-feedback/quality"

describe("AI 코칭 품질 계약", () => {
  it("원문 없이 성공률, 실패 code, latency, token과 retry를 표현한다", () => {
    const snapshot = aiFeedbackQualitySnapshotSchema.parse({
      failureCount: 1,
      failureCounts: [{ code: "provider-timeout", count: 1 }],
      from: "2026-07-23T15:00:00.000Z",
      latency: { averageMs: 1250, sampleCount: 2, totalMs: 2500 },
      requestCount: 3,
      retryCount: 1,
      status: "available",
      successCount: 1,
      successRate: 1 / 3,
      to: "2026-07-24T15:00:00.000Z",
      tokens: { input: 120, output: 80, sampleCount: 1 },
    })

    expect(snapshot).not.toHaveProperty("answer")
    expect(snapshot).not.toHaveProperty("feedback")
    expect(snapshot.failureCounts).toEqual([
      { code: "provider-timeout", count: 1 },
    ])
  })

  it("역전된 조회 기간과 원문 필드를 거절한다", () => {
    expect(
      aiFeedbackQualityQuerySchema.safeParse({
        from: "2026-07-24T15:00:00.000Z",
        to: "2026-07-23T15:00:00.000Z",
      }).success
    ).toBe(false)
    expect(
      aiFeedbackQualityQuerySchema.safeParse({
        from: "2025-07-23T15:00:00.000Z",
        to: "2026-07-24T15:00:00.000Z",
      }).success
    ).toBe(false)
    expect(
      aiFeedbackQualitySnapshotSchema.safeParse({
        answer: "원문",
        failureCount: 0,
        failureCounts: [],
        from: "2026-07-23T15:00:00.000Z",
        latency: { averageMs: null, sampleCount: 0, totalMs: 0 },
        requestCount: 0,
        retryCount: 0,
        status: "empty",
        successCount: 0,
        successRate: null,
        to: "2026-07-24T15:00:00.000Z",
        tokens: { input: 0, output: 0, sampleCount: 0 },
      }).success
    ).toBe(false)
  })
})
