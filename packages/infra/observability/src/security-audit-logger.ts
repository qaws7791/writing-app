import { isIP } from "node:net"
import type { Logger } from "pino"

import {
  logEventNames,
  logRetentionClasses,
  type SecurityEvent,
} from "#observability/events"
import { markSecurityLogRecord, redactUrlQuery } from "#observability/redaction"

export type SecurityAuditEvent = SecurityEvent & {
  readonly action:
    | "ai.quota.exceeded"
    | "authentication.failed"
    | "authorization.denied"
    | "owner.mutation"
    | "websocket.authorization.rejected"
  readonly actorId?: string
  readonly actorType?: "admin" | "learner"
  readonly clientIp?: string
  readonly reasonCode?: string
  readonly userAgent?: string
}

export type SecurityAuditLogger = (event: SecurityAuditEvent) => void

export type SecurityAuditLogRecord = SecurityAuditEvent & {
  readonly event: typeof logEventNames.securityAudit
  readonly retentionClass: typeof logRetentionClasses.security
}

export function createSecurityAuditLogger(
  logger: Pick<Logger, "info" | "warn">
): SecurityAuditLogger {
  return (event) => {
    const write = event.outcome === "succeeded" ? logger.info : logger.warn
    write.call(
      logger,
      createSecurityAuditLogRecord(event),
      logEventNames.securityAudit
    )
  }
}

function createSecurityAuditLogRecord(
  event: SecurityAuditEvent
): SecurityAuditLogRecord {
  const clientIp = normalizeClientIp(event.clientIp)
  const reasonCode = normalizeReasonCode(event.reasonCode)
  const userAgent = normalizeUserAgent(event.userAgent)

  return markSecurityLogRecord({
    action: event.action,
    ...(event.actorId === undefined ? {} : { actorId: event.actorId }),
    ...(event.actorType === undefined ? {} : { actorType: event.actorType }),
    ...(clientIp === undefined ? {} : { clientIp }),
    event: logEventNames.securityAudit,
    outcome: event.outcome,
    ...(reasonCode === undefined ? {} : { reasonCode }),
    requestId: event.requestId,
    retentionClass: logRetentionClasses.security,
    target: redactUrlQuery(event.target),
    ...(userAgent === undefined ? {} : { userAgent }),
  })
}

function normalizeClientIp(value: string | undefined): string | undefined {
  if (value === undefined) return undefined

  const normalized = value.trim()
  return isIP(normalized) === 0 ? undefined : normalized
}

function normalizeReasonCode(value: string | undefined): string | undefined {
  if (value === undefined || value.length === 0 || value.length > 64) {
    return undefined
  }

  return /^[A-Za-z0-9._:-]+$/u.test(value) ? value : undefined
}

function normalizeUserAgent(value: string | undefined): string | undefined {
  if (value === undefined) return undefined

  const normalized = value.replaceAll(/\p{Cc}/gu, "").trim()
  if (normalized.length === 0) return undefined

  return normalized.slice(0, 256)
}
