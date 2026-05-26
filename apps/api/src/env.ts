import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { z } from "zod"

const localCorsOrigins = "http://localhost:3000,http://localhost:3001"

const apiEnvSchema = z.object({
  CORS_ORIGIN: z.string().default(localCorsOrigins),
  DATABASE_URL: z.string().default("file:data/api.sqlite"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
})

export type ApiEnv = ReturnType<typeof parseApiEnv>

export function parseApiEnv(rawEnv: Record<string, string | undefined>) {
  const env = apiEnvSchema.parse(rawEnv)

  return {
    corsOrigins: env.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    databasePath: env.DATABASE_URL.startsWith("file:")
      ? env.DATABASE_URL.slice("file:".length)
      : env.DATABASE_URL,
    environment: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
    port: env.PORT,
  }
}

export function ensureDatabaseDirectory(databasePath: string) {
  const databaseDirectory = dirname(databasePath)

  if (databasePath === ":memory:" || databaseDirectory === ".") {
    return false
  }

  mkdirSync(databaseDirectory, { recursive: true })

  return true
}
