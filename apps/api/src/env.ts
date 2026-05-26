import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { z } from "zod"

const localCorsOrigins = "http://localhost:3000,http://localhost:3001"

const apiEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  CORS_ORIGIN: z.string().default(localCorsOrigins),
  DATABASE_URL: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  NODE_ENV: z.string().default("development"),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
})

export type ApiEnv = ReturnType<typeof parseApiEnv>

export function parseApiEnv(rawEnv: Record<string, string | undefined>) {
  const env = apiEnvSchema.parse(rawEnv)

  return {
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    betterAuthUrl: env.BETTER_AUTH_URL,
    corsOrigins: env.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    databasePath: env.DATABASE_URL.startsWith("file:")
      ? env.DATABASE_URL.slice("file:".length)
      : env.DATABASE_URL,
    environment: env.NODE_ENV,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    logLevel: env.LOG_LEVEL,
    openAiApiKey: env.OPENAI_API_KEY,
    openAiModel: env.OPENAI_MODEL,
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
