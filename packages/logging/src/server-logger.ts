import pino, { type Logger, type LoggerOptions } from "pino"

const appLogLevels = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
] as const

export type AppLogLevel = (typeof appLogLevels)[number]
export type AppLogger = Logger

function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === "development"
}

function createPrettyTransport() {
  return pino.transport({
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard",
    },
    target: "pino-pretty",
  })
}

export function createServerLogger(input: {
  service: string
  level: AppLogLevel
}): AppLogger {
  const options: LoggerOptions = {
    level: input.level,
    name: input.service,
  }

  return isDevelopmentEnvironment()
    ? pino(options, createPrettyTransport())
    : pino(options)
}

export function createSilentLogger(input?: { service?: string }): AppLogger {
  return pino({
    enabled: false,
    name: input?.service ?? "app",
  })
}

export function isAppLogLevel(value: string): value is AppLogLevel {
  return appLogLevels.includes(value as AppLogLevel)
}
