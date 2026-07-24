export const logEventNames = {
  aiUsage: "ai.usage",
  audit: "audit.recorded",
  eventDispatch: "event.dispatch",
  providerOperation: "provider.operation",
  requestCompleted: "request.completed",
  securityAudit: "security.audit",
} as const

export const logRetentionClasses = {
  aiUsage: "ai-usage-1y",
  application: "application-30d",
  auditHighRisk: "audit-3y",
  auditStandard: "audit-1y",
  security: "security-90d",
} as const

export type RequestCompletedEvent = Readonly<{
  audience: "admin" | "learner"
  durationMs: number
  errorClass?: "client-error" | "server-error"
  method: string
  outcome: "failed" | "succeeded"
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
  action: string
  actorId: string
  category: "user-lifecycle"
  event: typeof logEventNames.audit
  outcome: "failed" | "succeeded"
  requestId: string
  retentionClass: typeof logRetentionClasses.auditHighRisk
  targetId: string
}>

export type ProviderOperationEvent = Readonly<{
  durationMs: number
  event: typeof logEventNames.providerOperation
  operation: string
  outcome: "failed" | "succeeded"
  provider: string
  retentionClass: typeof logRetentionClasses.application
}>

export type EventDispatchEvent = Readonly<{
  event: typeof logEventNames.eventDispatch
  eventName: string
  listenerCount: number
  outcome: "failed" | "succeeded"
  retentionClass: typeof logRetentionClasses.application
}>

export type AuditEvent = Readonly<{
  action: string
  actorId: string
  category: "content" | "privacy" | "user-lifecycle"
  event: typeof logEventNames.audit
  outcome: "failed" | "succeeded"
  requestId: string
  retentionClass:
    | typeof logRetentionClasses.auditHighRisk
    | typeof logRetentionClasses.auditStandard
  targetId: string
}>

export type AiUsageEvent = Readonly<{
  durationMs: number
  event: typeof logEventNames.aiUsage
  failureCode?: string
  inputTokens?: number
  model: string
  operation: string
  outcome: "failed" | "succeeded"
  outputTokens?: number
  promptPolicyVersion?: string
  provider: string
  requestId?: string
  retentionClass: typeof logRetentionClasses.aiUsage
  totalTokens?: number
}>
