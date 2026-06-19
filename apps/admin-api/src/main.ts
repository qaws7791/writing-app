import { serve } from "bun"
import { createAdminService } from "@workspace/core/admin"
import { createDrizzleAdminRepository } from "@workspace/core/admin/admin-drizzle.repository"
import { createWritingAppDatabase } from "@workspace/db"
import {
  createAppLogger,
  createRequestLogger,
  defaultRequestLoggingRuntime,
} from "@workspace/logger"

import { createApp } from "@/app"
import { createAdminAuth, createAdminSessionResolver } from "@/auth/admin-auth"
import { parseAdminApiEnv } from "@/env"

const env = parseAdminApiEnv(process.env)
const database = createWritingAppDatabase(env.databaseUrl)
const logger = createAppLogger()
const adminRepository = createDrizzleAdminRepository(database.db)
const adminService = createAdminService({
  analyticsReader: adminRepository,
  contentResetRepository: adminRepository,
  courseRepository: adminRepository,
  dashboardReader: adminRepository,
  settingsRepository: adminRepository,
  userRepository: adminRepository,
})
const auth = createAdminAuth({
  authBaseUrl: env.authBaseUrl,
  cookieDomain: env.cookieDomain,
  db: database.db,
  secret: env.betterAuthSecret,
  webOrigin: env.adminOrigin,
})
const app = createApp({
  adminServices: {
    analytics: adminService,
    contentReset: adminService,
    courses: adminService,
    dashboard: adminService,
    settings: adminService,
    users: adminService,
  },
  adminOrigin: env.adminOrigin,
  authHandler: auth.handler,
  requestLogger: createRequestLogger(logger),
  requestLoggingRuntime: defaultRequestLoggingRuntime,
  sessionResolver: createAdminSessionResolver(auth),
})

if (import.meta.main) {
  serve({
    fetch: app.fetch,
    port: env.port,
  })
}

export { app }
