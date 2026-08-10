import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import { platformDayBoundary } from "@workspace/kernel/day-boundary"
import { err, ok, type Result } from "@workspace/kernel/result"
import type {
  AdminId,
  AdminMcpApprovalId,
  AdminMcpExecutionId,
} from "@workspace/types/ids"

import type {
  AuditEventRepository,
  AuditEventRepositoryError,
} from "#operations/application/ports/audit-event-repository"
import {
  createStartedAuditEvent,
  type AuditAction,
  type AuditCategory,
  type AuditEvent,
  type AuditEventId,
  type AuditEventValidationError,
  type AuditTarget,
} from "#operations/domain/audit-event"
import type { OperationsActor } from "#operations/domain/operations-actor"

type AuditTrailError =
  | AuditEventRepositoryError
  | AuditEventValidationError
  | Readonly<{ kind: "invalid-audit-query" }>

type AuditEventQuery = Readonly<{
  actor: OperationsActor
  category: AuditCategory | null
  from: string | null
  page: number
  pageSize: number
  to: string | null
}>

export type AuditEventPage = Readonly<{
  items: readonly AuditEvent[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}>

type AuditDayRange = Readonly<{
  createdBefore: Date | null
  createdFrom: Date | null
}>

const platformDayKeyPattern = /^\d{4}-\d{2}-\d{2}$/u

export type AuditTrail = Readonly<{
  begin: (input: {
    readonly action: AuditAction
    readonly actorId: AdminId
    readonly clientIp: string | null
    readonly requestId: string
    readonly target: AuditTarget
  }) => Promise<Result<AuditEvent, AuditTrailError>>
  beginMcp: (input: {
    readonly action: AuditAction
    readonly actorId: AdminId
    readonly approvalId: AdminMcpApprovalId | null
    readonly executionId: AdminMcpExecutionId
    readonly inputDigest: string
    readonly mcpCredentialId: string
    readonly requestId: string
    readonly target: AuditTarget
  }) => Promise<Result<AuditEvent, AuditTrailError>>
  complete: (input: {
    readonly eventId: AuditEventId
    readonly outcome: "failed" | "succeeded"
  }) => Promise<Result<void, AuditTrailError>>
  ensureMcpStarted: (input: {
    readonly action: AuditAction
    readonly actorId: AdminId
    readonly approvalId: AdminMcpApprovalId | null
    readonly createdAt: Date
    readonly eventId: string
    readonly executionId: AdminMcpExecutionId
    readonly inputDigest: string
    readonly mcpCredentialId: string
    readonly requestId: string
    readonly target: AuditTarget
  }) => Promise<Result<AuditEvent, AuditTrailError>>
  inspectExpired: (input: {
    readonly batchSize: number
    readonly cutoff: Date
  }) => Promise<Result<number, AuditTrailError>>
  purgeExpired: (input: {
    readonly batchSize: number
    readonly cutoff: Date
  }) => Promise<Result<number, AuditTrailError>>
  readEvents: (
    query: AuditEventQuery
  ) => Promise<Result<AuditEventPage, AuditTrailError>>
}>

export function createAuditTrail(input: {
  readonly clock: Clock
  readonly idGenerator: IdGenerator<string>
  readonly repository: AuditEventRepository
}): AuditTrail {
  return {
    async begin(command) {
      const event = createStartedAuditEvent({
        ...command,
        createdAt: input.clock.now(),
        id: input.idGenerator.next(),
      })
      if (event.isErr()) return err(event.error)

      const inserted = await input.repository.insert(event.value)
      return inserted.isErr() ? err(inserted.error) : event
    },
    async beginMcp(command) {
      const event = createStartedAuditEvent({
        action: command.action,
        actorId: command.actorId,
        clientIp: null,
        createdAt: input.clock.now(),
        id: input.idGenerator.next(),
        mcp: {
          approvalId: command.approvalId,
          executionId: command.executionId,
          inputDigest: command.inputDigest,
          mcpCredentialId: command.mcpCredentialId,
        },
        requestId: command.requestId,
        target: command.target,
      })
      if (event.isErr()) return err(event.error)

      const inserted = await input.repository.insert(event.value)
      return inserted.isErr() ? err(inserted.error) : event
    },
    async complete(command) {
      return input.repository.complete(command)
    },
    async ensureMcpStarted(command) {
      const event = createStartedAuditEvent({
        action: command.action,
        actorId: command.actorId,
        clientIp: null,
        createdAt: command.createdAt,
        id: command.eventId,
        mcp: {
          approvalId: command.approvalId,
          executionId: command.executionId,
          inputDigest: command.inputDigest,
          mcpCredentialId: command.mcpCredentialId,
        },
        requestId: command.requestId,
        target: command.target,
      })
      if (event.isErr()) return err(event.error)
      return input.repository.insertOrRead(event.value)
    },
    async inspectExpired(command) {
      if (!isValidRetentionQuery(command)) {
        return err({ kind: "invalid-audit-query" })
      }
      return input.repository.countExpired(command)
    },
    async purgeExpired(command) {
      if (!isValidRetentionQuery(command)) {
        return err({ kind: "invalid-audit-query" })
      }
      return input.repository.purgeExpired(command)
    },
    async readEvents(query) {
      const range = readAuditDayRange(query)
      if (range === null) return err({ kind: "invalid-audit-query" })

      const counted = await input.repository.countEvents({
        category: query.category,
        ...range,
      })
      if (counted.isErr()) return err(counted.error)

      const totalItems = counted.value
      const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize))
      const page = Math.min(query.page, totalPages)
      const listed = await input.repository.listEvents({
        category: query.category,
        limit: query.pageSize,
        offset: (page - 1) * query.pageSize,
        ...range,
      })

      return listed.isErr()
        ? err(listed.error)
        : ok({
            items: listed.value,
            page,
            pageSize: query.pageSize,
            totalItems,
            totalPages,
          })
    },
  }
}

/**
 * 논리 날짜를 조회 구간으로 바꾼다. `to`는 포함이므로 다음 날 시작을 상한으로 쓴다.
 * 시작이 끝보다 늦으면 조용히 빈 결과를 주는 대신 잘못된 질의로 거절한다.
 */
function readAuditDayRange(
  query: Pick<AuditEventQuery, "from" | "page" | "pageSize" | "to">
): AuditDayRange | null {
  if (
    !Number.isInteger(query.page) ||
    query.page < 1 ||
    !Number.isInteger(query.pageSize) ||
    query.pageSize < 1 ||
    query.pageSize > 100 ||
    !isPlatformDayKey(query.from) ||
    !isPlatformDayKey(query.to)
  ) {
    return null
  }

  const createdFrom =
    query.from === null ? null : toPlatformDayStart(query.from, 0)
  const createdBefore =
    query.to === null ? null : toPlatformDayStart(query.to, 1)

  if (
    createdFrom !== null &&
    createdBefore !== null &&
    createdFrom.getTime() >= createdBefore.getTime()
  ) {
    return null
  }

  return { createdBefore, createdFrom }
}

function isPlatformDayKey(value: string | null): boolean {
  return value === null || platformDayKeyPattern.test(value)
}

function toPlatformDayStart(dayKey: string, addDays: number): Date {
  return new Date(
    Date.UTC(
      Number(dayKey.slice(0, 4)),
      Number(dayKey.slice(5, 7)) - 1,
      Number(dayKey.slice(8, 10)) + addDays
    ) - platformDayBoundary.offsetMs
  )
}

function isValidRetentionQuery(input: {
  readonly batchSize: number
  readonly cutoff: Date
}): boolean {
  return (
    Number.isFinite(input.cutoff.getTime()) &&
    Number.isInteger(input.batchSize) &&
    input.batchSize >= 1 &&
    input.batchSize <= 1_000
  )
}
