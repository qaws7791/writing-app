import pino, { type DestinationStream, type Logger } from "pino"
import { z } from "zod"

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
      formatters: { log: redactLogObject },
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
      formatters: { log: redactLogObject },
      level: parsed.level,
    },
    stream
  )
}

export function createChildLogger(
  logger: AppLogger,
  bindings: Readonly<Record<string, unknown>>
): AppLogger {
  return logger.child(bindings)
}

function redactLogObject(object: object): Record<string, unknown> {
  return redactValue(object) as Record<string, unknown>
}

function redactValue(value: unknown, key = ""): unknown {
  if (isSensitiveKey(key)) return "[REDACTED]"
  if (Array.isArray(value)) return value.map((item) => redactValue(item))
  if (typeof value !== "object" || value === null) return value

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      redactValue(entryValue, entryKey),
    ])
  )
}

function isSensitiveKey(key: string): boolean {
  return /(?:secret|password|credential|session.?token|raw.?answer|answer.?text|email|ip.?address|user.?agent)/iu.test(
    key
  )
}
