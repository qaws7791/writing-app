import Database from "bun:sqlite"

import { createAdminService } from "@workspace/core/admin"
import {
  createDatabase,
  createDrizzleAdminRepository,
  runContentMigration,
} from "@workspace/db"
import { createLogger } from "@workspace/logger"

import { createAdminApiApp } from "@/app"
import { createAdminAuthRuntime } from "@/auth/admin-auth"
import { ensureDatabaseDirectory, parseAdminApiEnv } from "@/env"
import type { CourseThumbnailUploadService } from "@/routes/course-thumbnails.route"
import {
  createCourseThumbnailUpload,
  createS3CourseThumbnailUploadUrlFactory,
} from "@/storage/course-thumbnail-upload"

const env = parseAdminApiEnv(Bun.env)
const logger = createLogger({
  environment: env.environment,
  level: env.logLevel,
  service: "admin-api",
})

ensureDatabaseDirectory(env.databasePath)

const sqlite = new Database(env.databasePath, { create: true })
runContentMigration(sqlite)

const db = createDatabase(sqlite)
const adminService = createAdminService({
  repository: createDrizzleAdminRepository(db),
})
const auth = createAdminAuthRuntime({
  baseUrl: env.betterAuthUrl,
  db,
  secret: env.betterAuthSecret,
  trustedOrigins: env.corsOrigins,
})
const createUploadUrl = createS3CourseThumbnailUploadUrlFactory(
  env.assetStorage
)
const courseThumbnailUploads: CourseThumbnailUploadService = {
  async create(input) {
    try {
      return {
        status: "ok",
        value: await createCourseThumbnailUpload(input, {
          bucket: env.assetStorage.bucket,
          createUploadUrl,
          publicBaseUrl: env.assetStorage.publicBaseUrl,
        }),
      }
    } catch (error) {
      logger.error({ error }, "Course thumbnail signed URL creation failed")

      return {
        status: "unavailable",
        error: {
          code: "storage-unavailable",
          message: "스토리지를 사용할 수 없습니다.",
        },
      }
    }
  },
}

const app = createAdminApiApp({
  adminService,
  auth,
  courseThumbnailUploads,
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
