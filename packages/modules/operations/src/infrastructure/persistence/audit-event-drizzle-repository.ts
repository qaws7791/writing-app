import { and, asc, count, desc, eq, gte, inArray, lt, lte } from "drizzle-orm"
import type { WritingAppDatabase } from "@workspace/db/client"
import { err, ok } from "@workspace/kernel/result"
import type { AdminId, CourseId, UserId } from "@workspace/types/ids"

import type {
  AuditEventFailureObserver,
  AuditEventFilter,
  AuditEventOperation,
  AuditEventRepository,
} from "#operations/application/ports/audit-event-repository"

export type { AuditEventFailureObserver }
import type { AuditEvent, AuditEventId } from "#operations/domain/audit-event"
import { auditEvents } from "#operations/infrastructure/persistence/schema"

export function createAuditEventDrizzleRepository(
  database: WritingAppDatabase,
  observer: AuditEventFailureObserver
): AuditEventRepository {
  const persistenceFailed = (
    cause: unknown,
    operation: AuditEventOperation
  ) => {
    observer({ cause, kind: "audit-event-persistence-failed", operation })
    return err({ cause, kind: "audit-event-persistence-failed" } as const)
  }

  return {
    async countEvents(filter) {
      try {
        const row = database
          .select({ total: count() })
          .from(auditEvents)
          .where(createAuditEventFilterCondition(filter))
          .get()

        return ok(row?.total ?? 0)
      } catch (cause) {
        return persistenceFailed(cause, "count-events")
      }
    },
    async countExpired(input) {
      try {
        return ok(
          database
            .select({ id: auditEvents.id })
            .from(auditEvents)
            .where(lte(auditEvents.retentionUntil, input.cutoff))
            .orderBy(asc(auditEvents.retentionUntil), asc(auditEvents.id))
            .limit(input.batchSize)
            .all().length
        )
      } catch (cause) {
        return persistenceFailed(cause, "count-expired")
      }
    },
    async complete(input) {
      try {
        const updated = database
          .update(auditEvents)
          .set({ outcome: input.outcome })
          .where(
            and(
              eq(auditEvents.id, input.eventId),
              eq(auditEvents.outcome, "started")
            )
          )
          .returning({ id: auditEvents.id })
          .get()

        return updated === undefined
          ? err({ kind: "audit-event-conflict" } as const)
          : ok(undefined)
      } catch (cause) {
        return persistenceFailed(cause, "complete")
      }
    },
    async insert(event) {
      try {
        database.insert(auditEvents).values(toAuditEventRow(event)).run()
        return ok(undefined)
      } catch (cause) {
        return persistenceFailed(cause, "insert")
      }
    },
    async listEvents(input) {
      try {
        return ok(
          database
            .select()
            .from(auditEvents)
            .where(createAuditEventFilterCondition(input))
            .orderBy(desc(auditEvents.createdAt), desc(auditEvents.id))
            .limit(input.limit)
            .offset(input.offset)
            .all()
            .map(toAuditEvent)
        )
      } catch (cause) {
        return persistenceFailed(cause, "list-events")
      }
    },
    async purgeExpired(input) {
      try {
        const expiredIds = database
          .select({ id: auditEvents.id })
          .from(auditEvents)
          .where(lte(auditEvents.retentionUntil, input.cutoff))
          .orderBy(asc(auditEvents.retentionUntil), asc(auditEvents.id))
          .limit(input.batchSize)

        const deleted = database
          .delete(auditEvents)
          .where(inArray(auditEvents.id, expiredIds))
          .returning({ id: auditEvents.id })
          .all()

        return ok(deleted.length)
      } catch (cause) {
        return persistenceFailed(cause, "purge-expired")
      }
    },
  }
}

function createAuditEventFilterCondition(filter: AuditEventFilter) {
  return and(
    ...(filter.category === null
      ? []
      : [eq(auditEvents.category, filter.category)]),
    ...(filter.createdFrom === null
      ? []
      : [gte(auditEvents.createdAt, filter.createdFrom)]),
    ...(filter.createdBefore === null
      ? []
      : [lt(auditEvents.createdAt, filter.createdBefore)])
  )
}

function toAuditEventRow(event: AuditEvent) {
  return {
    action: event.action,
    actorId: event.actorId,
    category: event.category,
    clientIp: event.clientIp,
    createdAt: event.createdAt,
    id: event.id,
    outcome: event.outcome,
    requestId: event.requestId,
    retentionUntil: event.retentionUntil,
    targetId: event.target.id,
    targetType: event.target.type,
  }
}

function toAuditEvent(row: typeof auditEvents.$inferSelect): AuditEvent {
  return {
    action: row.action,
    actorId: row.actorId as AdminId,
    category: row.category,
    clientIp: row.clientIp,
    createdAt: new Date(row.createdAt),
    id: row.id as AuditEventId,
    outcome: row.outcome,
    requestId: row.requestId,
    retentionUntil: new Date(row.retentionUntil),
    target:
      row.targetType === "learner"
        ? { id: row.targetId as UserId, type: "learner" }
        : { id: row.targetId as CourseId, type: "course" },
  }
}
