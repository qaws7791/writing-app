import { describe, expect, it, vi } from "vitest"
import { err, ok } from "@workspace/kernel/result"

import { createDeletedLearnerPurgeCommand } from "#identity/application/deleted-learner-purge"
import { calculateDeletedLearnerPurgeCutoff } from "#identity/domain/deleted-learner-retention"

const now = new Date("2026-07-24T12:00:00.000Z")

describe("삭제 학습자 purge application", () => {
  it("현재 시각에서 정확히 5일을 뺀 cutoff를 repository에 전달한다", async () => {
    const purgeDeletedBefore = vi.fn(async () =>
      ok({ matchedUserCount: 2, purgedUserCount: 2 })
    )
    const command = createDeletedLearnerPurgeCommand({
      clock: { now: () => now },
      repository: { purgeDeletedBefore },
    })

    await expect(command.execute()).resolves.toEqual(
      ok({
        cutoff: new Date("2026-07-19T12:00:00.000Z"),
        matchedUserCount: 2,
        purgedUserCount: 2,
      })
    )
    expect(purgeDeletedBefore).toHaveBeenCalledWith({
      batchSize: 1_000,
      cutoff: new Date("2026-07-19T12:00:00.000Z"),
      dryRun: false,
    })
  })

  it("repository 실패를 성공으로 숨기지 않는다", async () => {
    const command = createDeletedLearnerPurgeCommand({
      clock: { now: () => now },
      repository: {
        async purgeDeletedBefore() {
          return err({ kind: "deleted-learner-purge-failed" })
        },
      },
    })

    await expect(command.execute()).resolves.toEqual(
      err({ kind: "deleted-learner-purge-failed" })
    )
  })

  it("유효하지 않은 기준 시각을 거절한다", () => {
    expect(() =>
      calculateDeletedLearnerPurgeCutoff(new Date(Number.NaN))
    ).toThrow(/기준 시각/u)
  })
})
