import { describe, expect, it, vi } from "vitest"
import type { AdminId, UserId } from "@workspace/types/ids"
import { err, ok } from "@workspace/kernel/result"

import { createAuditTrail } from "#operations/application/audit-trail"
import type { AuditEventRepository } from "#operations/application/ports/audit-event-repository"

const actorId = "admin-1" as AdminId
const userId = "user-1" as UserId
const now = new Date("2026-07-24T00:00:00.000Z")

describe("operations audit trail", () => {
  it("저장 성공 뒤에만 started event를 반환하고 outcome을 종결한다", async () => {
    const repository = createRepositoryFake()
    const trail = createAuditTrail({
      clock: { now: () => now },
      idGenerator: { next: () => "audit-1" },
      repository,
    })

    const started = await trail.begin({
      action: "learner.delete",
      actorId,
      clientIp: null,
      requestId: "request-1",
      target: { id: userId, type: "learner" },
    })

    expect(started._unsafeUnwrap()).toMatchObject({
      actorId,
      id: "audit-1",
      outcome: "started",
    })
    await expect(
      trail.complete({
        eventId: started._unsafeUnwrap().id,
        outcome: "succeeded",
      })
    ).resolves.toEqual(ok(undefined))
    expect(repository.insert).toHaveBeenCalledOnce()
    expect(repository.complete).toHaveBeenCalledWith({
      eventId: "audit-1",
      outcome: "succeeded",
    })
  })

  it("사전 audit 저장 실패를 성공으로 숨기지 않는다", async () => {
    const repository = createRepositoryFake({
      insertFailure: true,
    })
    const trail = createAuditTrail({
      clock: { now: () => now },
      idGenerator: { next: () => "audit-1" },
      repository,
    })

    await expect(
      trail.begin({
        action: "learner.delete",
        actorId,
        clientIp: null,
        requestId: "request-1",
        target: { id: userId, type: "learner" },
      })
    ).resolves.toEqual(err({ kind: "audit-event-persistence-failed" }))
  })

  it("관리자 조회와 retention batch 입력 상한을 검증한다", async () => {
    const repository = createRepositoryFake()
    const trail = createAuditTrail({
      clock: { now: () => now },
      idGenerator: { next: () => "audit-1" },
      repository,
    })

    await expect(
      trail.readRecent({ actor: { id: actorId }, limit: 101 })
    ).resolves.toEqual(err({ kind: "invalid-audit-query" }))
    await expect(
      trail.purgeExpired({ batchSize: 0, cutoff: now })
    ).resolves.toEqual(err({ kind: "invalid-audit-query" }))
    await expect(
      trail.inspectExpired({ batchSize: 0, cutoff: now })
    ).resolves.toEqual(err({ kind: "invalid-audit-query" }))
    expect(repository.countExpired).not.toHaveBeenCalled()
    expect(repository.listRecent).not.toHaveBeenCalled()
    expect(repository.purgeExpired).not.toHaveBeenCalled()
  })
})

function createRepositoryFake(
  input: Readonly<{ insertFailure?: boolean }> = {}
): AuditEventRepository {
  return {
    countExpired: vi.fn(async () => ok(0)),
    complete: vi.fn(async () => ok(undefined)),
    insert: vi.fn(async () =>
      input.insertFailure === true
        ? err({ kind: "audit-event-persistence-failed" as const })
        : ok(undefined)
    ),
    listRecent: vi.fn(async () => ok([])),
    purgeExpired: vi.fn(async () => ok(0)),
  }
}
