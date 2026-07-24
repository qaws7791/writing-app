import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import { err, type Result } from "@workspace/kernel/result"
import type { AdminId } from "@workspace/types/ids"

import type {
  AuditEventRepository,
  AuditEventRepositoryError,
} from "#operations/application/ports/audit-event-repository"
import {
  createStartedAuditEvent,
  type AuditAction,
  type AuditEvent,
  type AuditEventId,
  type AuditEventValidationError,
  type AuditTarget,
} from "#operations/domain/audit-event"
import type { OperationsActor } from "#operations/domain/operations-actor"

export type AuditTrailError =
  | AuditEventRepositoryError
  | AuditEventValidationError
  | Readonly<{ kind: "invalid-audit-query" }>

export type AuditTrail = Readonly<{
  begin: (input: {
    readonly action: AuditAction
    readonly actorId: AdminId
    readonly clientIp: string | null
    readonly requestId: string
    readonly target: AuditTarget
  }) => Promise<Result<AuditEvent, AuditTrailError>>
  complete: (input: {
    readonly eventId: AuditEventId
    readonly outcome: "failed" | "succeeded"
  }) => Promise<Result<void, AuditTrailError>>
  inspectExpired: (input: {
    readonly batchSize: number
    readonly cutoff: Date
  }) => Promise<Result<number, AuditTrailError>>
  purgeExpired: (input: {
    readonly batchSize: number
    readonly cutoff: Date
  }) => Promise<Result<number, AuditTrailError>>
  readRecent: (input: {
    readonly actor: OperationsActor
    readonly limit: number
  }) => Promise<Result<readonly AuditEvent[], AuditTrailError>>
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
    async complete(command) {
      return input.repository.complete(command)
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
    async readRecent(query) {
      if (
        !Number.isInteger(query.limit) ||
        query.limit < 1 ||
        query.limit > 100
      ) {
        return err({ kind: "invalid-audit-query" })
      }
      return input.repository.listRecent(query.limit)
    },
  }
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
