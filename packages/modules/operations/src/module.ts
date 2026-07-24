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
import type { AuditEventRepository } from "#operations/application/ports/audit-event-repository"
import type { OperationsClock } from "#operations/application/ports/operations-ports"
import type { OperationsReportingRepository } from "#operations/application/ports/operations-reporting-repository"

export type OperationsModule = Readonly<{
  auditTrail: AuditTrail
  reporting: OperationsReportingQueries
}>

export function createOperationsModule(
  input: Readonly<{
    audit: Readonly<{
      idGenerator: IdGenerator<string>
      repository: AuditEventRepository
    }>
    clock: OperationsClock
    reporting: OperationsReportingRepository
    reportingFailureObserver: OperationsReportingFailureObserver
  }>
): OperationsModule {
  const reporting = createOperationsReportingQueries({
    observer: input.reportingFailureObserver,
    repository: input.reporting,
  })
  const auditTrail = createAuditTrail({
    clock: input.clock,
    idGenerator: input.audit.idGenerator,
    repository: input.audit.repository,
  })

  return {
    auditTrail,
    reporting,
  }
}
