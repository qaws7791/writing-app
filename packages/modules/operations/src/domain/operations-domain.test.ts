import { describe, expect, it } from "vitest"
import { decideAiRequestLimit } from "#operations/domain/ai-request-limit"

describe("operations domain", () => {
  it("limit counter가 경계에 도달하면 안정된 원인과 Retry-After를 결정한다", () => {
    const now = new Date("2026-07-23T00:00:00.000Z")
    expect(
      decideAiRequestLimit({
        counters: [
          {
            count: 20,
            limit: 20,
            reason: "admin-minute",
            resetAt: new Date(now.getTime() + 30_001),
          },
        ],
        now,
      })
    ).toEqual({
      kind: "rejected",
      reason: "admin-minute",
      retryAfterSeconds: 31,
    })
  })
})
