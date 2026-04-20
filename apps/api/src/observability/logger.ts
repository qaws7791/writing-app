import {
  createServerLogger,
  createSilentLogger as createBaseSilentLogger,
  isAppLogLevel,
  type AppLogger,
  type AppLogLevel,
} from "@workspace/logging"

export type ApiLogLevel = AppLogLevel
export type ApiLogger = AppLogger

export function createApiLogger(input: { level: ApiLogLevel }): ApiLogger {
  return createServerLogger({
    service: "api",
    level: input.level,
  })
}

export function createSilentLogger(): ApiLogger {
  return createBaseSilentLogger({
    service: "api",
  })
}

export function isApiLogLevel(value: string): value is ApiLogLevel {
  return isAppLogLevel(value)
}
