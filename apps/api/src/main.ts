import Database from "bun:sqlite"

import { createAiFeedbackService } from "@workspace/core/ai-feedback"
import { createContentService } from "@workspace/core/content"
import { createLearningService } from "@workspace/core/learning"
import {
  createDatabase,
  createDrizzleContentRepository,
  createDrizzleFeedbackRepository,
  createDrizzleLearningRepository,
  runContentMigration,
  seedContent,
} from "@workspace/db"
import { createLogger } from "@workspace/logger"

import { createApiApp } from "@/app"
import { createAuthRuntime } from "@/auth/auth"
import { ensureDatabaseDirectory, parseApiEnv } from "@/env"
import { createOpenAiFeedbackProvider } from "@/openai/openai-feedback-provider"

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
const learningService = createLearningService({
  contentService,
  repository: createDrizzleLearningRepository(db),
})
const aiFeedbackService = createAiFeedbackService({
  contentService,
  feedbackRepository: createDrizzleFeedbackRepository(db),
  learningRepository: createDrizzleLearningRepository(db),
  provider: createOpenAiFeedbackProvider({
    apiKey: env.openAiApiKey,
    model: env.openAiModel,
  }),
})
const auth = createAuthRuntime({
  baseUrl: env.betterAuthUrl,
  db,
  googleClientId: env.googleClientId,
  googleClientSecret: env.googleClientSecret,
  secret: env.betterAuthSecret,
})

const app = createApiApp({
  aiFeedbackService,
  auth,
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
  learningService,
  logger,
})

Bun.serve({
  fetch: app.fetch,
  port: env.port,
})

logger.info({ port: env.port }, "API server started")
