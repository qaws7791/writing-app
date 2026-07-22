import type { Logger } from "pino"

import type { RequestCompletedEvent } from "#observability/events"

export type RequestAudience = "admin" | "learner"

export type RequestLogEvent = RequestCompletedEvent & {
  readonly actorId?: string
  readonly actorType?: "admin" | "learner"
  readonly adminId?: string
  readonly externalRequestId?: string
  readonly userId?: string
}

export type RequestLogger = (event: RequestLogEvent) => void

export function createRequestLogger(
  logger: Pick<Logger, "info">
): RequestLogger {
  return (event) => {
    logger.info(event, "request.completed")
  }
}
