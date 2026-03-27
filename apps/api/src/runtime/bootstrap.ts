import {
  createAIRequestRepository,
  createDailyRecommendationRepository,
  createWritingRepository,
  createPromptRepository,
  createWritingSyncRepository,
  createWritingSyncWriter,
  createWritingTransactionRepository,
  createWritingVersionRepository,
  migrateDatabase,
  openDb,
  readSqliteVersion,
  seedDatabase,
  authSchema,
} from "@workspace/database"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { createResendEmailSender } from "@workspace/email"

import type { AppServices } from "../app-env"
import { createApp } from "../app"
import { createAIApiService } from "../ai-services"
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
  apiBaseUrl: string
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
    apiBaseUrl: apiEnv.API_BASE_URL,
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
  const isProduction = process.env.NODE_ENV === "production"
  const devEmailPort = isProduction
    ? null
    : createDevEmailPort({
        exposeSensitiveData: process.env.NODE_ENV === "development",
        logger: logger.child({
          scope: "auth-email",
        }),
      })
  const emailSender = isProduction
    ? createResendEmailSender({
        apiKey: apiEnv.RESEND_API_KEY!,
        fromAddress: apiEnv.RESEND_FROM_ADDRESS!,
      })
    : devEmailPort!
  const authDatabaseAdapter = drizzleAdapter(database.db, {
    provider: "sqlite",
    schema: authSchema,
  })
  const authUserPort = {
    findUserByEmail: (email: string) =>
      database.db.query.user.findFirst({
        where: (fields, { eq }) => eq(fields.email, email),
      }),
  }
  const auth = createAuth(
    authDatabaseAdapter,
    authUserPort,
    environment,
    emailSender
  )

  await migrateDatabase(database.db)
  if (environment.seedOnStartup) {
    seedDatabase(database.db)
  }

  const promptRepository = createPromptRepository(database.db)
  const writingRepository = createWritingRepository(database.db)
  const aiRequestRepository = createAIRequestRepository(database.db)
  const dailyRecommendationRepository = createDailyRecommendationRepository(
    database.db
  )
  const writingSyncRepository = createWritingSyncRepository(database.db)
  const writingSyncWriter = createWritingSyncWriter(database.db)
  const writingTransactionRepository = createWritingTransactionRepository(
    database.db
  )
  const writingVersionRepository = createWritingVersionRepository(database.db)

  const aiUseCases = createAIApiService({
    aiRequestRepository,
    logger: logger.child({ scope: "ai-services" }),
  })
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
    syncWriter: writingSyncWriter,
    transactionRepository: writingTransactionRepository,
    versionRepository: writingVersionRepository,
  })

  const services: AppServices = {
    aiUseCases,
    authHandler: auth.handler,
    writingUseCases,
    homeUseCases,
    promptUseCases,
    writingSyncUseCases,
    readLatestAuthEmail: devEmailPort?.readLatestMessage,
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
      apiBaseUrl: environment.apiBaseUrl,
      authDebugEnabled: process.env.NODE_ENV !== "production",
      getSession: (request) =>
        auth.api.getSession({ headers: request.headers }),
      logger,
      services,
    }),
    close: () => {
      devEmailPort?.clear()
      database.close()
    },
    sqliteVersion,
  }
}
