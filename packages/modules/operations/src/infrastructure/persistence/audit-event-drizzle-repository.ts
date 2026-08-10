import { and, asc, count, desc, eq, gte, inArray, lt, lte } from "drizzle-orm"
import type { WritingAppDatabase } from "@workspace/db/client"
import { err, ok } from "@workspace/kernel/result"
import type {
  AdminId,
  AdminMcpApprovalId,
  AdminMcpExecutionId,
  CourseId,
  UserId,
} from "@workspace/types/ids"

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
        return database.transaction((transaction) => {
          const current = transaction
            .select({ outcome: auditEvents.outcome })
            .from(auditEvents)
            .where(eq(auditEvents.id, input.eventId))
            .get()
          if (current?.outcome === input.outcome) return ok(undefined)
          if (current?.outcome !== "started") {
            return err({ kind: "audit-event-conflict" } as const)
          }

          const updated = transaction
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
        })
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
    async insertOrRead(event) {
      try {
        return database.transaction((transaction) => {
          const row = transaction
            .select()
            .from(auditEvents)
            .where(eq(auditEvents.id, event.id))
            .get()
          if (row !== undefined) {
            const current = toAuditEvent(row)
            return hasSameAuditIdentity(current, event)
              ? ok(current)
              : err({ kind: "audit-event-conflict" } as const)
          }

          transaction.insert(auditEvents).values(toAuditEventRow(event)).run()
          return ok(event)
        })
      } catch (cause) {
        return persistenceFailed(cause, "insert-or-read")
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
    mcpApprovalId: event.mcp?.approvalId ?? null,
    mcpExecutionId: event.mcp?.executionId ?? null,
    mcpInputDigest: event.mcp?.inputDigest ?? null,
    mcpOauthClientId: event.mcp?.oauthClientId ?? null,
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
    mcp:
      row.mcpExecutionId === null ||
      row.mcpInputDigest === null ||
      row.mcpOauthClientId === null
        ? null
        : {
            approvalId:
              row.mcpApprovalId === null
                ? null
                : (row.mcpApprovalId as AdminMcpApprovalId),
            executionId: row.mcpExecutionId as AdminMcpExecutionId,
            inputDigest: row.mcpInputDigest,
            oauthClientId: row.mcpOauthClientId,
          },
    outcome: row.outcome,
    requestId: row.requestId,
    retentionUntil: new Date(row.retentionUntil),
    target:
      row.targetType === "learner"
        ? { id: row.targetId as UserId, type: "learner" }
        : { id: row.targetId as CourseId, type: "course" },
  }
}

function hasSameAuditIdentity(left: AuditEvent, right: AuditEvent): boolean {
  return (
    left.action === right.action &&
    left.actorId === right.actorId &&
    left.category === right.category &&
    left.clientIp === right.clientIp &&
    left.createdAt.getTime() === right.createdAt.getTime() &&
    left.id === right.id &&
    left.requestId === right.requestId &&
    left.retentionUntil.getTime() === right.retentionUntil.getTime() &&
    left.target.id === right.target.id &&
    left.target.type === right.target.type &&
    left.mcp?.approvalId === right.mcp?.approvalId &&
    left.mcp?.executionId === right.mcp?.executionId &&
    left.mcp?.inputDigest === right.mcp?.inputDigest &&
    left.mcp?.oauthClientId === right.mcp?.oauthClientId
  )
}
