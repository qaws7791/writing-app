import { and, asc, desc, eq, inArray, lte } from "drizzle-orm"
import type { WritingAppDatabase } from "@workspace/db/client"
import { err, ok } from "@workspace/kernel/result"
import type { AdminId, CourseId, UserId } from "@workspace/types/ids"

import type { AuditEventRepository } from "#operations/application/ports/audit-event-repository"
import type { AuditEvent, AuditEventId } from "#operations/domain/audit-event"
import { auditEvents } from "#operations/infrastructure/persistence/schema"

export function createAuditEventDrizzleRepository(
  database: WritingAppDatabase
): AuditEventRepository {
  return {
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
      } catch {
        return err({ kind: "audit-event-persistence-failed" })
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
          ? err({ kind: "audit-event-conflict" })
          : ok(undefined)
      } catch {
        return err({ kind: "audit-event-persistence-failed" })
      }
    },
    async insert(event) {
      try {
        database.insert(auditEvents).values(toAuditEventRow(event)).run()
        return ok(undefined)
      } catch {
        return err({ kind: "audit-event-persistence-failed" })
      }
    },
    async listRecent(limit) {
      try {
        return ok(
          database
            .select()
            .from(auditEvents)
            .orderBy(desc(auditEvents.createdAt), desc(auditEvents.id))
            .limit(limit)
            .all()
            .map(toAuditEvent)
        )
      } catch {
        return err({ kind: "audit-event-persistence-failed" })
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
      } catch {
        return err({ kind: "audit-event-persistence-failed" })
      }
    },
  }
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
