import type { Logger } from "pino"

export type RequestLogEvent = {
  readonly adminId?: string
  readonly durationMs: number
  readonly method: string
  readonly path: string
  readonly requestId?: string
  readonly status: number
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
