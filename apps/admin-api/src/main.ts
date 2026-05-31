import Database from "bun:sqlite"

import { createAdminService } from "@workspace/core/admin"
import { configureSqliteConnection, createDatabase } from "@workspace/db/client"
import { createDrizzleAdminRepository } from "@workspace/db/repositories/drizzle-admin.repository"
import { createLogger } from "@workspace/logger"

import { createAdminApiApp } from "@/app"
import { createAdminAuthRuntime } from "@/auth/admin-auth"
import { ensureDatabaseDirectory, parseAdminApiEnv } from "@/env"

const env = parseAdminApiEnv(Bun.env)
const logger = createLogger({
  environment: env.environment,
  level: env.logLevel,
  service: "admin-api",
})

ensureDatabaseDirectory(env.databasePath)

const sqlite = new Database(env.databasePath, { create: true })
configureSqliteConnection(sqlite)

const db = createDatabase(sqlite)
const adminService = createAdminService({
  repository: createDrizzleAdminRepository(db),
})
const auth = createAdminAuthRuntime({
  baseUrl: env.betterAuthUrl,
  cookieDomain: env.cookieDomain,
  db,
  secret: env.betterAuthSecret,
  trustedOrigins: env.corsOrigins,
})

const app = createAdminApiApp({
  adminService,
  auth,
  async checkDatabase() {
    try {
      sqlite.query("select 1").get()

      return true
    } catch (error) {
      logger.error({ error }, "Admin database health check failed")

      return false
    }
  },
  corsOrigins: env.corsOrigins,
  logger,
})

Bun.serve({
  fetch: app.fetch,
  port: env.port,
})

logger.info({ port: env.port }, "Admin API server started")
