import pino, { type DestinationStream, type Logger } from "pino"

export {
  createRequestLogger,
  type RequestLogger,
  type RequestLogEvent,
} from "@workspace/logger/request-logger"
export {
  createRequestLoggingMiddleware,
  defaultRequestLoggingRuntime,
  type RequestLoggingMiddlewareOptions,
  type RequestLoggingRuntime,
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
  const isPretty =
    process.env.NODE_ENV === "development" || process.env.LOG_PRETTY === "true"

  if (isPretty && !stream) {
    return pino({
      base: null,
      level,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    })
  }

  return pino(
    {
      base: null,
      level,
    },
    stream
  )
}
