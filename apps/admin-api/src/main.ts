import { serve } from "bun"
import { createAdminService } from "@workspace/core/admin"
import { createDrizzleAdminRepository, createKwepDatabase } from "@workspace/db"
import { createAppLogger, createRequestLogger } from "@workspace/logger"

import { createApp } from "@/app"
import { createAdminBearerSessionResolver } from "@/auth/admin-auth"
import { parseAdminApiEnv } from "@/env"

const env = parseAdminApiEnv(process.env)
const database = createKwepDatabase(env.databaseUrl)
const logger = createAppLogger()
const adminRepository = createDrizzleAdminRepository(database.db)
const app = createApp({
  adminOrigin: env.adminOrigin,
  dashboardService: createAdminService(adminRepository),
  requestLogger: createRequestLogger(logger),
  sessionResolver: createAdminBearerSessionResolver(database.db),
})

if (import.meta.main) {
  serve({
    fetch: app.fetch,
    port: env.port,
  })
}

export { app }
