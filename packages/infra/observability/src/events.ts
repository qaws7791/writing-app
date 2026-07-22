export type RequestCompletedEvent = Readonly<{
  audience: "admin" | "learner"
  durationMs: number
  method: string
  path: string
  requestId: string
  status: number
}>

export type SecurityEvent = Readonly<{
  action: string
  outcome: "denied" | "failed" | "succeeded"
  requestId: string
  target: string
}>

export type OwnerMutationEvent = Readonly<{
  actorId: string
  mutation: string
  outcome: "failed" | "succeeded"
  requestId: string
  targetId: string
}>

export type ProviderOperationEvent = Readonly<{
  durationMs: number
  operation: string
  outcome: "failed" | "succeeded"
  provider: string
}>

export type EventDispatchEvent = Readonly<{
  eventName: string
  listenerCount: number
  outcome: "failed" | "succeeded"
}>
