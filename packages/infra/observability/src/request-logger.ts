import type { Logger } from "pino"

import {
  logEventNames,
  logRetentionClasses,
  type RequestCompletedEvent,
} from "#observability/events"
import { redactUrlQuery } from "#observability/redaction"

export type RequestAudience = "admin" | "admin-mcp" | "learner"

export type RequestLogEvent = RequestCompletedEvent & {
  readonly actorId?: string
  readonly actorType?: "admin" | "learner"
  readonly externalRequestId?: string
  readonly mcpCredentialId?: string
}

export type RequestLogger = (event: RequestLogEvent) => void

export type RequestLogRecord = RequestLogEvent & {
  readonly event: typeof logEventNames.requestCompleted
  readonly retentionClass: typeof logRetentionClasses.application
}

export function createRequestLogger(
  logger: Pick<Logger, "info">
): RequestLogger {
  return (event) => {
    logger.info(createRequestLogRecord(event), logEventNames.requestCompleted)
  }
}

function createRequestLogRecord(event: RequestLogEvent): RequestLogRecord {
  return {
    ...(event.actorId === undefined ? {} : { actorId: event.actorId }),
    ...(event.actorType === undefined ? {} : { actorType: event.actorType }),
    audience: event.audience,
    durationMs: event.durationMs,
    ...(event.errorClass === undefined ? {} : { errorClass: event.errorClass }),
    event: logEventNames.requestCompleted,
    ...(event.externalRequestId === undefined
      ? {}
      : { externalRequestId: event.externalRequestId }),
    method: event.method,
    ...(event.mcpCredentialId === undefined
      ? {}
      : { mcpCredentialId: event.mcpCredentialId }),
    outcome: event.outcome,
    path: redactUrlQuery(event.path),
    requestId: event.requestId,
    retentionClass: logRetentionClasses.application,
    status: event.status,
  }
}
