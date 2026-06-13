import type { Logger } from "pino"

export type RequestLogEvent = {
  readonly durationMs: number
  readonly method: string
  readonly path: string
  readonly requestId?: string
  readonly status: number
}

export type RequestLogger = (event: RequestLogEvent) => void

export function createRequestLogger(
  logger: Pick<Logger, "info">
): RequestLogger {
  return (event) => {
    logger.info(event, "request.completed")
  }
}
