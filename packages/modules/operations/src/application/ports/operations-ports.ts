import type { OperationsActor } from "#operations/domain/operations-actor"

export type OperationsAdminSessionPort = Readonly<{
  resolveActor: (headers: Headers) => Promise<OperationsActor | null>
}>

export type OperationsClock = Readonly<{ now: () => Date }>
