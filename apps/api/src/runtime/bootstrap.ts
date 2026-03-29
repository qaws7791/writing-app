import { migrateDatabase, seedDatabase } from "@workspace/database"

import type { AppUseCases } from "../app-env"
import { createApp } from "../app"
import { apiEnv } from "../config/env"
import type { ApiLogLevel } from "../observability/logger"
import { createApiContainer } from "./container"

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
  const container = createApiContainer(environment)
  const { auth, database, devEmailInbox, logger, sqliteVersion } =
    container.cradle

  await migrateDatabase(database.db)
  if (environment.seedOnStartup) {
    seedDatabase(database.db)
  }

  const useCases: AppUseCases = {
    aiUseCases: container.cradle.aiUseCases,
    authHandler: auth.handler,
    autosaveWritingUseCase: container.cradle.autosaveWritingUseCase,
    createWritingUseCase: container.cradle.createWritingUseCase,
    deleteWritingUseCase: container.cradle.deleteWritingUseCase,
    getHomeUseCase: container.cradle.getHomeUseCase,
    getPromptUseCase: container.cradle.getPromptUseCase,
    getVersionUseCase: container.cradle.getVersionUseCase,
    getWritingUseCase: container.cradle.getWritingUseCase,
    listPromptsUseCase: container.cradle.listPromptsUseCase,
    listVersionsUseCase: container.cradle.listVersionsUseCase,
    listWritingsUseCase: container.cradle.listWritingsUseCase,
    pullDocumentUseCase: container.cradle.pullDocumentUseCase,
    pushTransactionsUseCase: container.cradle.pushTransactionsUseCase,
    readLatestAuthEmail: devEmailInbox?.readLatestMessage,
    savePromptUseCase: container.cradle.savePromptUseCase,
    sqliteVersion,
    unsavePromptUseCase: container.cradle.unsavePromptUseCase,
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
      useCases,
    }),
    close: () => {
      void container.dispose()
    },
    sqliteVersion,
  }
}
