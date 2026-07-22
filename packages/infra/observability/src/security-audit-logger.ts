import type { Logger } from "pino"

import type { SecurityEvent } from "#observability/events"

export type SecurityAuditEvent = SecurityEvent & {
  readonly action:
    | "ai.quota.exceeded"
    | "authentication.failed"
    | "authorization.denied"
    | "owner.mutation"
    | "websocket.authorization.rejected"
  readonly actorId?: string
  readonly actorType?: "admin" | "learner"
  readonly reason?: string
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
