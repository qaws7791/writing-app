import { serve } from "bun"
import { createAdminService } from "@workspace/core/admin"
import { createDrizzleAdminRepository } from "@workspace/core/admin/admin-drizzle.repository"
import { createKwepDatabase } from "@workspace/db"
import {
  createAppLogger,
  createRequestLogger,
  defaultRequestLoggingRuntime,
} from "@workspace/logger"

import { createApp } from "@/app"
import { createAdminAuth, createAdminSessionResolver } from "@/auth/admin-auth"
import { parseAdminApiEnv } from "@/env"

const env = parseAdminApiEnv(process.env)
const database = createKwepDatabase(env.databaseUrl)
const logger = createAppLogger()
const adminRepository = createDrizzleAdminRepository(database.db)
const auth = createAdminAuth({
  authBaseUrl: env.authBaseUrl,
  cookieDomain: env.cookieDomain,
  db: database.db,
  secret: env.betterAuthSecret,
  webOrigin: env.adminOrigin,
})
const app = createApp({
  adminOrigin: env.adminOrigin,
  authHandler: auth.handler,
  dashboardService: createAdminService(adminRepository),
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
