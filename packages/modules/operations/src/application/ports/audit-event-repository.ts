import type { Result } from "@workspace/kernel/result"

import type { AuditEvent, AuditEventId } from "#operations/domain/audit-event"

export type AuditEventRepositoryError =
  | Readonly<{ kind: "audit-event-conflict" }>
  | Readonly<{ kind: "audit-event-persistence-failed" }>

export type AuditEventRepository = Readonly<{
  countExpired: (input: {
    readonly batchSize: number
    readonly cutoff: Date
  }) => Promise<Result<number, AuditEventRepositoryError>>
  complete: (input: {
    readonly eventId: AuditEventId
    readonly outcome: "failed" | "succeeded"
  }) => Promise<Result<void, AuditEventRepositoryError>>
  insert: (
    event: AuditEvent
  ) => Promise<Result<void, AuditEventRepositoryError>>
  listRecent: (
    limit: number
  ) => Promise<Result<readonly AuditEvent[], AuditEventRepositoryError>>
  purgeExpired: (input: {
    readonly batchSize: number
    readonly cutoff: Date
  }) => Promise<Result<number, AuditEventRepositoryError>>
}>
