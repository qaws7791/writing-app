import {
  createDraftRepository,
  createPromptRepository,
  migrateDatabase,
  openDb,
  readSqliteVersion,
  seedDatabase,
} from "@workspace/database"

import type { AppServices } from "../app-env"
import { createApp } from "../app"
import {
  createDraftApiService,
  createHomeApiService,
  createPromptApiService,
} from "../application-services"
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
  const draftRepository = createDraftRepository(database.db)

  const promptUseCases = createPromptApiService(promptRepository)
  const draftUseCases = createDraftApiService({
    draftRepository,
    promptRepository,
  })
  const homeUseCases = createHomeApiService({
    draftRepository,
    promptRepository,
  })

  const services: AppServices = {
    authHandler: auth.handler,
    draftUseCases,
    homeUseCases,
    promptUseCases,
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
