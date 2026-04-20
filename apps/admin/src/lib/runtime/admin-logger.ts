import { createServerLogger, type AppLogLevel } from "@workspace/logging"

function resolveAdminLogLevel(): AppLogLevel {
  return process.env.NODE_ENV === "development" ? "debug" : "info"
}

export const adminLogger = createServerLogger({
  service: "admin",
  level: resolveAdminLogLevel(),
})
