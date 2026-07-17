import type { Logger } from "pino"

export type SecurityAuditEvent = {
  readonly action:
    | "ai.quota.exceeded"
    | "authentication.failed"
    | "authorization.denied"
    | "owner.mutation"
    | "websocket.authorization.rejected"
  readonly actorId?: string
  readonly actorType?: "admin" | "learner"
  readonly outcome: "denied" | "failed" | "succeeded"
  readonly reason?: string
  readonly requestId: string
  readonly target: string
}

export type SecurityAuditLogger = (event: SecurityAuditEvent) => void

export function createSecurityAuditLogger(
  logger: Pick<Logger, "info" | "warn">
): SecurityAuditLogger {
  return (event) => {
    const write = event.outcome === "succeeded" ? logger.info : logger.warn
    write.call(logger, event, "security.audit")
  }
}
