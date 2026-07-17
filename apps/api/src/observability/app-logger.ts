import pino, { type DestinationStream, type Logger } from "pino"

export type AppLogger = Logger

export type CreateAppLoggerOptions = {
  readonly level?: string
  readonly stream?: DestinationStream
}

type LoggerEnvironment = {
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
  stream,
}: CreateAppLoggerOptions = {}): AppLogger {
  const isPretty = shouldUsePrettyLogging(process.env)

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
