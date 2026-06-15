import pino, { type DestinationStream, type Logger } from "pino"

export {
  createRequestLogger,
  type RequestLogger,
  type RequestLogEvent,
} from "@workspace/logger/request-logger"
export {
  createRequestLoggingMiddleware,
  type RequestLoggingMiddlewareOptions,
} from "@workspace/logger/hono-request-logger"

export type AppLogger = Logger

export type CreateAppLoggerOptions = {
  readonly level?: string
  readonly stream?: DestinationStream
}

export function createAppLogger({
  level = "info",
  stream,
}: CreateAppLoggerOptions = {}): AppLogger {
  return pino(
    {
      base: null,
      level,
    },
    stream
  )
}
