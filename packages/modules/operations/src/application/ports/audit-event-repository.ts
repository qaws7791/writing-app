import type { Failure } from "@workspace/kernel/failure"
import type { Result } from "@workspace/kernel/result"

import type { AuditEvent, AuditEventId } from "#operations/domain/audit-event"

export type AuditEventOperation =
  | "complete"
  | "count-expired"
  | "insert"
  | "list-recent"
  | "purge-expired"

export type AuditEventRepositoryError =
  | Failure<"audit-event-conflict">
  | Failure<"audit-event-persistence-failed">

/** 감사 기록 실패는 흔적 없이 사라지면 안 되므로 조립 계층이 로그를 남긴다. */
export type AuditEventFailureObserver = (
  event: Readonly<{
    cause: unknown
    kind: "audit-event-persistence-failed"
    operation: AuditEventOperation
  }>
) => void

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
