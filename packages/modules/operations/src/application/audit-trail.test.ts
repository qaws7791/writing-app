import { describe, expect, it, vi } from "vitest"
import type { AdminId, UserId } from "@workspace/types/ids"
import { err, ok } from "@workspace/kernel/result"

import {
  createAuditTrail,
  type AuditEventQuery,
} from "#operations/application/audit-trail"
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

    await expect(trail.readEvents(query({ pageSize: 101 }))).resolves.toEqual(
      err({ kind: "invalid-audit-query" })
    )
    await expect(
      trail.purgeExpired({ batchSize: 0, cutoff: now })
    ).resolves.toEqual(err({ kind: "invalid-audit-query" }))
    await expect(
      trail.inspectExpired({ batchSize: 0, cutoff: now })
    ).resolves.toEqual(err({ kind: "invalid-audit-query" }))
    expect(repository.countExpired).not.toHaveBeenCalled()
    expect(repository.listEvents).not.toHaveBeenCalled()
    expect(repository.purgeExpired).not.toHaveBeenCalled()
  })

  it("기간을 플랫폼 날짜 경계로 바꾸고 종료일을 포함해 조회한다", async () => {
    const repository = createRepositoryFake()
    const trail = createAuditTrail({
      clock: { now: () => now },
      idGenerator: { next: () => "audit-1" },
      repository,
    })

    await expect(
      trail.readEvents(
        query({
          category: "privacy-access",
          from: "2026-07-30",
          to: "2026-07-31",
        })
      )
    ).resolves.toEqual(
      ok({ items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 1 })
    )
    expect(repository.listEvents).toHaveBeenCalledWith({
      category: "privacy-access",
      createdBefore: new Date("2026-08-01T00:00:00+09:00"),
      createdFrom: new Date("2026-07-30T00:00:00+09:00"),
      limit: 50,
      offset: 0,
    })
  })

  it("시작일이 종료일보다 늦으면 조용히 비우지 않고 거절한다", async () => {
    const repository = createRepositoryFake()
    const trail = createAuditTrail({
      clock: { now: () => now },
      idGenerator: { next: () => "audit-1" },
      repository,
    })

    await expect(
      trail.readEvents(query({ from: "2026-07-31", to: "2026-07-30" }))
    ).resolves.toEqual(err({ kind: "invalid-audit-query" }))
    expect(repository.countEvents).not.toHaveBeenCalled()
    expect(repository.listEvents).not.toHaveBeenCalled()
  })

  it("전체 건수를 넘는 페이지 요청은 마지막 페이지로 수렴한다", async () => {
    const repository = createRepositoryFake({ totalItems: 60 })
    const trail = createAuditTrail({
      clock: { now: () => now },
      idGenerator: { next: () => "audit-1" },
      repository,
    })

    await expect(trail.readEvents(query({ page: 9 }))).resolves.toEqual(
      ok({ items: [], page: 2, pageSize: 50, totalItems: 60, totalPages: 2 })
    )
    expect(repository.listEvents).toHaveBeenCalledWith({
      category: null,
      createdBefore: null,
      createdFrom: null,
      limit: 50,
      offset: 50,
    })
  })
})

function query(overrides: Partial<AuditEventQuery> = {}): AuditEventQuery {
  return {
    actor: { id: actorId },
    category: null,
    from: null,
    page: 1,
    pageSize: 50,
    to: null,
    ...overrides,
  }
}

function createRepositoryFake(
  input: Readonly<{ insertFailure?: boolean; totalItems?: number }> = {}
): AuditEventRepository {
  return {
    countEvents: vi.fn(async () => ok(input.totalItems ?? 0)),
    countExpired: vi.fn(async () => ok(0)),
    complete: vi.fn(async () => ok(undefined)),
    insert: vi.fn(async () =>
      input.insertFailure === true
        ? err({ kind: "audit-event-persistence-failed" as const })
        : ok(undefined)
    ),
    listEvents: vi.fn(async () => ok([])),
    purgeExpired: vi.fn(async () => ok(0)),
  }
}
