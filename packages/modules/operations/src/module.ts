import type { SqlDatabaseClient as Database } from "@workspace/db/sql-client"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { IdGenerator } from "@workspace/kernel/clock"

import {
  createAuditTrail,
  type AuditTrail,
} from "#operations/application/audit-trail"
import {
  createOperationsReportingQueries,
  type OperationsReportingFailureObserver,
  type OperationsReportingQueries,
} from "#operations/application/operations-reporting"
import type { AuditEventFailureObserver } from "#operations/application/ports/audit-event-repository"
import type { OperationsClock } from "#operations/application/ports/operations-ports"
import { createAuditEventDrizzleRepository } from "#operations/infrastructure/persistence/audit-event-drizzle-repository"
import { createSqliteOperationsReportingRepository } from "#operations/infrastructure/persistence/operations-reporting-sqlite-repository"

export type OperationsModule = Readonly<{
  auditTrail: AuditTrail
  reporting: OperationsReportingQueries
}>

export async function createOperationsModule(
  input: Readonly<{
    audit: Readonly<{
      failureObserver: AuditEventFailureObserver
      idGenerator: IdGenerator<string>
    }>
    clock: OperationsClock
    database: WritingAppDatabase
    reportingDatabase: Database
    reportingFailureObserver: OperationsReportingFailureObserver
  }>
): Promise<OperationsModule> {
  const reporting = createOperationsReportingQueries({
    observer: input.reportingFailureObserver,
    repository: await createSqliteOperationsReportingRepository(
      input.reportingDatabase
    ),
  })
  const auditTrail = createAuditTrail({
    clock: input.clock,
    idGenerator: input.audit.idGenerator,
    repository: createAuditEventDrizzleRepository(
      input.database,
      input.audit.failureObserver
    ),
  })

  return {
    auditTrail,
    reporting,
  }
}
