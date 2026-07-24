import { describe, expect, it, vi } from "vitest"
import { ok } from "@workspace/kernel/result"

import { createAiFeedbackMaintenance } from "#ai-feedback/application/ai-feedback-maintenance"

describe("AI feedback maintenance", () => {
  it.each([0, -1, 1.5, 1_001, Number.NaN])(
    "batchSize %s를 repository 호출 전에 거절한다",
    async (batchSize) => {
      const clock = { now: vi.fn(() => new Date("2026-07-23T01:00:00.000Z")) }
      const repository = {
        expireStalePending: vi.fn(),
      }
      const maintenance = createAiFeedbackMaintenance({ clock, repository })

      const result = await maintenance.expireStalePending({ batchSize })

      expect(result.isErr() && result.error).toEqual({
        batchSize,
        kind: "invalid-batch-size",
        maximum: 1_000,
        minimum: 1,
      })
      expect(clock.now).not.toHaveBeenCalled()
      expect(repository.expireStalePending).not.toHaveBeenCalled()
    }
  )

  it("한 번 읽은 cutoff를 repository와 결과가 공유한다", async () => {
    const cutoff = new Date("2026-07-23T01:00:00.000Z")
    const clock = { now: vi.fn(() => cutoff) }
    const repository = {
      expireStalePending: vi.fn(async () =>
        ok({ expiredAttempts: 1, matchedAttempts: 1 })
      ),
    }
    const maintenance = createAiFeedbackMaintenance({ clock, repository })

    const result = await maintenance.expireStalePending({
      batchSize: 25,
      dryRun: false,
    })

    expect(repository.expireStalePending).toHaveBeenCalledWith({
      batchSize: 25,
      dryRun: false,
      occurredAt: cutoff,
    })
    expect(result.isOk() && result.value).toEqual({
      cutoff,
      expiredAttempts: 1,
      matchedAttempts: 1,
    })
    expect(clock.now).toHaveBeenCalledTimes(1)
  })
})
