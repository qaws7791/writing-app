import {
  createDailyRecommendationRepository,
  createWritingRepository,
  createPromptRepository,
  createWritingSyncRepository,
  createWritingTransactionRepository,
  createWritingVersionRepository,
  migrateDatabase,
  openDb,
  readSqliteVersion,
  seedDatabase,
} from "@workspace/database"

import type { AppServices } from "../app-env"
import { createApp } from "../app"
import {
  createWritingApiService,
  createHomeApiService,
  createPromptApiService,
} from "../application-services"
import { createWritingSyncApiService } from "../writing-services"
import { createAuth } from "../auth/auth"
import { createDevEmailPort } from "../auth/auth-email"
import { apiEnv } from "../config/env"
import { createApiLogger, type ApiLogLevel } from "../observability/logger"

export type ApiEnvironment = {
  authBaseUrl: string
  authSecret: string
  databasePath: string
  logLevel: ApiLogLevel
  port: number
  seedOnStartup: boolean
  webBaseUrl: string
}

export type AppDependencies = {
  app: ReturnType<typeof createApp>
  close: () => void
  sqliteVersion: string
}

export function readApiEnvironment(): ApiEnvironment {
  return {
    authBaseUrl: apiEnv.API_AUTH_BASE_URL,
    authSecret: apiEnv.API_AUTH_SECRET,
    databasePath: apiEnv.API_DATABASE_PATH,
    logLevel: apiEnv.API_LOG_LEVEL,
    port: apiEnv.API_PORT,
    seedOnStartup: process.env.NODE_ENV !== "production",
    webBaseUrl: apiEnv.API_WEB_BASE_URL,
  }
}

export async function createApiDependencies(
  environment: ApiEnvironment
): Promise<AppDependencies> {
  const logger = createApiLogger({
    level: environment.logLevel,
  })
  const database = openDb(environment.databasePath)
  const sqliteVersion = readSqliteVersion(database.sqlite)
  const authEmailPort = createDevEmailPort({
    exposeSensitiveData: process.env.NODE_ENV === "development",
    logger: logger.child({
      scope: "auth-email",
    }),
  })
  const auth = createAuth(database.db, environment, authEmailPort)

  await migrateDatabase(database.db)
  if (environment.seedOnStartup) {
    seedDatabase(database.db)
  }

  const promptRepository = createPromptRepository(database.db)
  const writingRepository = createWritingRepository(database.db)
  const dailyRecommendationRepository = createDailyRecommendationRepository(
    database.db
  )
  const writingSyncRepository = createWritingSyncRepository(database.db)
  const writingTransactionRepository = createWritingTransactionRepository(
    database.db
  )
  const writingVersionRepository = createWritingVersionRepository(database.db)

  const promptUseCases = createPromptApiService(promptRepository)
  const writingUseCases = createWritingApiService({
    writingRepository,
    promptRepository,
  })
  const homeUseCases = createHomeApiService({
    dailyRecommendationRepository,
    writingRepository,
    promptRepository,
  })
  const writingSyncUseCases = createWritingSyncApiService({
    writingRepository: writingSyncRepository,
    transactionRepository: writingTransactionRepository,
    versionRepository: writingVersionRepository,
  })

  const services: AppServices = {
    authHandler: auth.handler,
    writingUseCases,
    homeUseCases,
    promptUseCases,
    writingSyncUseCases,
    readLatestAuthEmail:
      process.env.NODE_ENV !== "production"
        ? authEmailPort.readLatestMessage
        : undefined,
    sqliteVersion,
  }

  logger.info(
    {
      databasePath: environment.databasePath,
      port: environment.port,
      sqliteVersion,
    },
    "api dependencies ready"
  )

  return {
    app: createApp({
      allowedOrigins: [environment.webBaseUrl],
      authDebugEnabled: process.env.NODE_ENV !== "production",
      getSession: (request) =>
        auth.api.getSession({ headers: request.headers }),
      logger,
      services,
    }),
    close: () => {
      authEmailPort.clear()
      database.close()
    },
    sqliteVersion,
  }
}
