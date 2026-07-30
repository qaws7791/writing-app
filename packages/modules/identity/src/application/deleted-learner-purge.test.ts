import { describe, expect, it, vi } from "vitest"
import { err, ok } from "@workspace/kernel/result"

import { createDeletedLearnerPurgeCommand } from "#identity/application/deleted-learner-purge"
import {
  calculateDeletedLearnerPurgeCutoff,
  defaultDeletedLearnerRetentionDays,
} from "#identity/domain/deleted-learner-retention"

const now = new Date("2026-07-24T12:00:00.000Z")

describe("삭제 학습자 purge application", () => {
  it("주입한 보존 기간만큼 뺀 cutoff를 repository에 전달한다", async () => {
    const purgeDeletedBefore = vi.fn(async () =>
      ok({ matchedUserCount: 2, purgedUserCount: 2 })
    )
    const command = createDeletedLearnerPurgeCommand({
      clock: { now: () => now },
      repository: { purgeDeletedBefore },
      retentionDays: defaultDeletedLearnerRetentionDays,
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

  it("보존 기간을 늘리면 같은 시각에서 더 이른 cutoff를 만든다", async () => {
    const purgeDeletedBefore = vi.fn(async () =>
      ok({ matchedUserCount: 0, purgedUserCount: 0 })
    )
    const command = createDeletedLearnerPurgeCommand({
      clock: { now: () => now },
      repository: { purgeDeletedBefore },
      retentionDays: 30,
    })

    await command.execute()

    expect(purgeDeletedBefore).toHaveBeenCalledWith({
      batchSize: 1_000,
      cutoff: new Date("2026-06-24T12:00:00.000Z"),
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
      retentionDays: defaultDeletedLearnerRetentionDays,
    })

    await expect(command.execute()).resolves.toEqual(
      err({ kind: "deleted-learner-purge-failed" })
    )
  })

  it("유효하지 않은 기준 시각을 거절한다", () => {
    expect(() =>
      calculateDeletedLearnerPurgeCutoff(
        new Date(Number.NaN),
        defaultDeletedLearnerRetentionDays
      )
    ).toThrow(/기준 시각/u)
  })

  it.each([0, -1, 1.5, Number.NaN])(
    "보존 기간 %s는 cutoff 계산 전에 거절한다",
    (retentionDays) => {
      expect(() =>
        calculateDeletedLearnerPurgeCutoff(now, retentionDays)
      ).toThrow(/보존 기간/u)
    }
  )
})
