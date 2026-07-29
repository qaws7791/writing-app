import type { Database } from "bun:sqlite"
import type { AdminSessionResolver } from "@workspace/identity/ports"
import {
  createOperationsModule,
  type OperationsModule,
} from "@workspace/operations/module"
import type { OperationsAdminSessionPort } from "@workspace/operations/ports"
import { logEventNames } from "@workspace/observability/events"
import type { AppLogger } from "@workspace/observability/logger"
import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import type { WritingAppDatabase } from "@workspace/db/client"

export function composeOperationsModule(
  input: Readonly<{
    clock: Clock
    database: WritingAppDatabase
    idGenerator: IdGenerator<string>
    logger: AppLogger
    reportingDatabase: Database
  }>
): OperationsModule {
  return createOperationsModule({
    audit: {
      failureObserver(event) {
        input.logger.error(event, logEventNames.auditPersistenceFailed)
      },
      idGenerator: input.idGenerator,
    },
    clock: input.clock,
    database: input.database,
    reportingDatabase: input.reportingDatabase,
    reportingFailureObserver(event) {
      input.logger.warn(event, "operations.reporting.query_failed")
    },
  })
}

export function createOperationsAdminSessionPort(
  sessionResolver: AdminSessionResolver
): OperationsAdminSessionPort {
  return {
    async resolveActor(headers) {
      const session = await sessionResolver.resolveSession(headers)
      if (session === null) return null
      return {
        id: session.admin.id,
      }
    },
  }
}
