import pino, { type DestinationStream, type Logger } from "pino"
import { z } from "zod"

import { redactLogRecord, redactLogValue } from "#observability/redaction"

export type AppLogger = Logger

export type CreateAppLoggerOptions = {
  readonly level?: string
  readonly pretty?: boolean
  readonly stream?: DestinationStream
}

export type LoggerEnvironment = {
  readonly LOG_PRETTY?: string
  readonly NODE_ENV?: string
}

export function shouldUsePrettyLogging(
  environment: LoggerEnvironment
): boolean {
  if (environment.LOG_PRETTY === "true") return true
  if (environment.LOG_PRETTY === "false") return false

  return environment.NODE_ENV === "development"
}

export function createAppLogger({
  level = "info",
  pretty = false,
  stream,
}: CreateAppLoggerOptions = {}): AppLogger {
  const parsed = z
    .object({ level: z.string().min(1), pretty: z.boolean() })
    .parse({ level, pretty })

  if (parsed.pretty && !stream) {
    return pino({
      base: null,
      formatters: { log: redactLogRecord },
      level: parsed.level,
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
      formatters: { log: redactLogRecord },
      level: parsed.level,
    },
    stream
  )
}

export function createChildLogger(
  logger: AppLogger,
  bindings: Readonly<Record<string, unknown>>
): AppLogger {
  return logger.child(redactLogValue(bindings) as Record<string, unknown>)
}
