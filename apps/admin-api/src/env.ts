import { mkdirSync, statSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { parseEnv, type RawEnv } from "@workspace/env"
import { z } from "zod"

const adminApiEnvSchema = z.object({
  ADMIN_ASSET_PUBLIC_BASE_URL: z.string().url(),
  ADMIN_ASSET_S3_ACCESS_KEY: z.string().min(1),
  ADMIN_ASSET_S3_BUCKET: z.string().min(1),
  ADMIN_ASSET_S3_ENDPOINT: z.string().url(),
  ADMIN_ASSET_S3_REGION: z.string().min(1).default("us-east-1"),
  ADMIN_ASSET_S3_SECRET_KEY: z.string().min(1),
  ADMIN_BETTER_AUTH_SECRET: z.string().min(1),
  ADMIN_BETTER_AUTH_URL: z.string().url(),
  ADMIN_CORS_ORIGIN: z.string().default("http://localhost:3001"),
  DATABASE_URL: z.string().min(1),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(4001),
})

export type AdminApiEnv = ReturnType<typeof parseAdminApiEnv>

export function parseAdminApiEnv(rawEnv: RawEnv) {
  const env = parseEnv({
    schema: adminApiEnvSchema,
    runtimeEnv: rawEnv,
  })

  return {
    assetStorage: {
      accessKey: env.ADMIN_ASSET_S3_ACCESS_KEY,
      bucket: env.ADMIN_ASSET_S3_BUCKET,
      endpoint: env.ADMIN_ASSET_S3_ENDPOINT,
      publicBaseUrl: env.ADMIN_ASSET_PUBLIC_BASE_URL,
      region: env.ADMIN_ASSET_S3_REGION,
      secretKey: env.ADMIN_ASSET_S3_SECRET_KEY,
    },
    betterAuthSecret: env.ADMIN_BETTER_AUTH_SECRET,
    betterAuthUrl: env.ADMIN_BETTER_AUTH_URL,
    corsOrigins: env.ADMIN_CORS_ORIGIN.split(",")
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

  const resolvedDatabaseDirectory = resolve(databaseDirectory)

  try {
    if (statSync(resolvedDatabaseDirectory).isDirectory()) {
      return false
    }
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error
    }
  }

  mkdirSync(resolvedDatabaseDirectory, { recursive: true })

  return true
}
