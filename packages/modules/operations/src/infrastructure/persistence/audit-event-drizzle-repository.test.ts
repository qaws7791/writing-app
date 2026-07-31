import { describe, expect, it } from "vitest"
import {
  createInMemoryWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import type { AdminId, CourseId, UserId } from "@workspace/types/ids"

import type { AuditEventRepository } from "#operations/application/ports/audit-event-repository"
import type { AuditEvent, AuditEventId } from "#operations/domain/audit-event"
import { createAuditEventDrizzleRepository } from "#operations/infrastructure/persistence/audit-event-drizzle-repository"

const actorId = "admin-1" as AdminId
const learnerId = "user-1" as UserId

describe("audit event drizzle repository", () => {
  it("코스 보관 해제 감사 기록을 저장한다", async () => {
    const client = createAuditDatabase()

    try {
      const repository = createRepository(client)
      const createdAt = new Date("2026-07-31T02:00:00.000Z")

      const inserted = await repository.insert({
        action: "course.restore",
        actorId,
        category: "content-mutation",
        clientIp: null,
        createdAt,
        id: "audit-restore" as AuditEventId,
        outcome: "started",
        requestId: "request-restore",
        retentionUntil: readRetentionUntil(createdAt, "content-mutation"),
        target: { id: "course-1" as CourseId, type: "course" },
      })

      expect(inserted.isOk()).toBe(true)
    } finally {
      client.close()
    }
  })

  it("종료일 다음 날 첫 순간은 구간에서 제외한다", async () => {
    const client = createAuditDatabase()

    try {
      const repository = createRepository(client)
      await insertAll(repository, [
        anAuditEvent({
          createdAt: new Date("2026-07-30T00:00:00+09:00"),
          id: "audit-from-start",
        }),
        anAuditEvent({
          createdAt: new Date("2026-07-31T23:59:59+09:00"),
          id: "audit-to-end",
        }),
        anAuditEvent({
          createdAt: new Date("2026-08-01T00:00:00+09:00"),
          id: "audit-next-day",
        }),
      ])

      const listed = await repository.listEvents({
        category: null,
        createdBefore: new Date("2026-08-01T00:00:00+09:00"),
        createdFrom: new Date("2026-07-30T00:00:00+09:00"),
        limit: 50,
        offset: 0,
      })

      if (listed.isErr()) throw new Error("감사 이벤트 조회에 실패했습니다.")
      expect(listed.value.map((event) => event.id)).toEqual([
        "audit-to-end",
        "audit-from-start",
      ])
    } finally {
      client.close()
    }
  })

  it("category 필터와 offset이 함께 적용되어 페이지가 겹치지 않는다", async () => {
    const client = createAuditDatabase()

    try {
      const repository = createRepository(client)
      await insertAll(repository, [
        anAuditEvent({
          action: "learner.detail.read",
          createdAt: new Date("2026-07-31T03:00:00.000Z"),
          id: "audit-read-late",
        }),
        anAuditEvent({
          action: "learner.detail.read",
          createdAt: new Date("2026-07-31T02:00:00.000Z"),
          id: "audit-read-early",
        }),
        anAuditEvent({
          action: "learner.status.suspend",
          createdAt: new Date("2026-07-31T04:00:00.000Z"),
          id: "audit-suspend",
        }),
      ])
      const filter = {
        category: "privacy-access",
        createdBefore: null,
        createdFrom: null,
      } as const

      const counted = await repository.countEvents(filter)
      const firstPage = await repository.listEvents({
        ...filter,
        limit: 1,
        offset: 0,
      })
      const secondPage = await repository.listEvents({
        ...filter,
        limit: 1,
        offset: 1,
      })

      if (counted.isErr() || firstPage.isErr() || secondPage.isErr()) {
        throw new Error("감사 이벤트 조회에 실패했습니다.")
      }
      expect(counted.value).toBe(2)
      expect(firstPage.value.map((event) => event.id)).toEqual([
        "audit-read-late",
      ])
      expect(secondPage.value.map((event) => event.id)).toEqual([
        "audit-read-early",
      ])
    } finally {
      client.close()
    }
  })
})

function createAuditDatabase(): WritingAppDatabaseClient {
  const client = createInMemoryWritingAppDatabase()

  try {
    runCurrentTestMigration(client.sqlite)
    return client
  } catch (error) {
    client.close()
    throw error
  }
}

function createRepository(client: WritingAppDatabaseClient) {
  return createAuditEventDrizzleRepository(client.db, () => undefined)
}

async function insertAll(
  repository: AuditEventRepository,
  events: readonly AuditEvent[]
): Promise<void> {
  for (const event of events) {
    const inserted = await repository.insert(event)
    if (inserted.isErr()) {
      throw new Error("감사 이벤트 저장에 실패했습니다.")
    }
  }
}

function anAuditEvent(
  overrides: Omit<Partial<AuditEvent>, "id"> &
    Readonly<{ createdAt: Date; id: string }>
): AuditEvent {
  const action = overrides.action ?? "learner.detail.read"
  const category =
    action === "learner.detail.read" ? "privacy-access" : "identity-mutation"

  return {
    actorId,
    category,
    clientIp: null,
    outcome: "succeeded",
    requestId: `request-${overrides.id}`,
    retentionUntil: readRetentionUntil(overrides.createdAt, category),
    target: { id: learnerId, type: "learner" },
    ...overrides,
    action,
    id: overrides.id as AuditEventId,
  }
}

/** 보존 기한은 schema check가 `createdAt` 기준으로 강제하므로 fixture도 같은 식을 쓴다. */
function readRetentionUntil(
  createdAt: Date,
  category: AuditEvent["category"]
): Date {
  const oneYearMs = 31_536_000_000

  return new Date(
    createdAt.getTime() +
      (category === "identity-mutation" ? 3 * oneYearMs : oneYearMs)
  )
}
