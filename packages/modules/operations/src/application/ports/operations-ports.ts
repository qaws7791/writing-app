import type { OperationsActor } from "#operations/domain/operations-actor"

export type { AuditTrail } from "#operations/application/audit-trail"
export type { AuditAction, AuditTarget } from "#operations/domain/audit-event"
export type { AuditEventFailureObserver } from "#operations/application/ports/audit-event-repository"

export type OperationsAdminSessionPort = Readonly<{
  resolveActor: (headers: Headers) => Promise<OperationsActor | null>
}>

export type OperationsClock = Readonly<{ now: () => Date }>
