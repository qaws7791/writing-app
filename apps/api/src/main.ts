import Database from "bun:sqlite"

import { createContentService } from "@workspace/core/content"
import {
  createDatabase,
  createDrizzleContentRepository,
  runContentMigration,
  seedContent,
} from "@workspace/db"
import { createLogger } from "@workspace/logger"

import { createApiApp } from "@/app"
import { ensureDatabaseDirectory, parseApiEnv } from "@/env"

const env = parseApiEnv(Bun.env)
const logger = createLogger({
  environment: env.environment,
  level: env.logLevel,
  service: "api",
})

ensureDatabaseDirectory(env.databasePath)

const sqlite = new Database(env.databasePath, { create: true })
runContentMigration(sqlite)

const db = createDatabase(sqlite)
await seedContent(db)

const contentService = createContentService({
  repository: createDrizzleContentRepository(db),
})

const app = createApiApp({
  async checkDatabase() {
    try {
      sqlite.query("select 1").get()

      return true
    } catch (error) {
      logger.error({ error }, "Database health check failed")

      return false
    }
  },
  contentService,
  corsOrigins: env.corsOrigins,
  logger,
})

Bun.serve({
  fetch: app.fetch,
  port: env.port,
})

logger.info({ port: env.port }, "API server started")
