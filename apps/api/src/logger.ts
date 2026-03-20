import pino, { type Logger, type LoggerOptions } from "pino"

const apiLogLevels = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
] as const

export type ApiLogLevel = (typeof apiLogLevels)[number]
export type ApiLogger = Logger

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

export function createApiLogger(input: { level: ApiLogLevel }): ApiLogger {
  const options: LoggerOptions = {
    level: input.level,
    name: "api",
  }

  return isDevelopmentEnvironment()
    ? pino(options, createPrettyTransport())
    : pino(options)
}

export function createSilentLogger(): ApiLogger {
  return pino({
    enabled: false,
    name: "api",
  })
}

export function isApiLogLevel(value: string): value is ApiLogLevel {
  return apiLogLevels.includes(value as ApiLogLevel)
}
