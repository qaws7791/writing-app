import type { Failure } from "@workspace/kernel/failure"
import type { Result } from "@workspace/kernel/result"

import type {
  AuditCategory,
  AuditEvent,
  AuditEventId,
} from "#operations/domain/audit-event"

export type AuditEventOperation =
  | "complete"
  | "count-events"
  | "count-expired"
  | "insert"
  | "insert-or-read"
  | "list-events"
  | "purge-expired"

/** `createdBefore`는 상한 제외이며 `null`은 해당 경계를 두지 않는다는 뜻이다. */
export type AuditEventFilter = Readonly<{
  category: AuditCategory | null
  createdBefore: Date | null
  createdFrom: Date | null
}>

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
  countEvents: (
    filter: AuditEventFilter
  ) => Promise<Result<number, AuditEventRepositoryError>>
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
  insertOrRead: (
    event: AuditEvent
  ) => Promise<Result<AuditEvent, AuditEventRepositoryError>>
  listEvents: (
    input: AuditEventFilter &
      Readonly<{
        limit: number
        offset: number
      }>
  ) => Promise<Result<readonly AuditEvent[], AuditEventRepositoryError>>
  purgeExpired: (input: {
    readonly batchSize: number
    readonly cutoff: Date
  }) => Promise<Result<number, AuditEventRepositoryError>>
}>
