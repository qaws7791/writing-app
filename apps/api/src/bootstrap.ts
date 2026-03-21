import {
  createDraftUseCasesAdapter,
  createHomeUseCasesAdapter,
  createPromptUseCasesAdapter,
} from "@workspace/backend-core"
import {
  createDraftRepository,
  createPromptRepository,
  migrateDatabase,
  openDb,
  readSqliteVersion,
  seedDatabase,
} from "@workspace/db"

import { resolveAgainstApiPackage } from "./api-package-paths.js"
import { createApp } from "./app.js"
import { createAuth } from "./auth.js"
import { createAuthEmailPort } from "./auth-email.js"
import { apiEnv } from "./env.js"
import { createApiLogger, type ApiLogLevel } from "./logger.js"

export type ApiEnvironment = {
  authBaseUrl: string
  authSecret: string
  databasePath: string
  logLevel: ApiLogLevel
  port: number
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
    databasePath: resolveAgainstApiPackage(apiEnv.API_DATABASE_PATH),
    logLevel: apiEnv.API_LOG_LEVEL,
    port: apiEnv.API_PORT,
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
  const authEmailPort = createAuthEmailPort({
    exposeSensitiveData: process.env.NODE_ENV === "development",
    logger: logger.child({
      scope: "auth-email",
    }),
  })
  const auth = createAuth(database.db, environment, authEmailPort)

  await migrateDatabase(database.db)
  seedDatabase(database.db)

  const promptRepository = createPromptRepository(database.db)
  const draftRepository = createDraftRepository(database.db)

  const promptUseCases = createPromptUseCasesAdapter(promptRepository)
  const draftUseCases = createDraftUseCasesAdapter(
    draftRepository,
    promptRepository
  )
  const homeUseCases = createHomeUseCasesAdapter(
    draftRepository,
    promptRepository
  )

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
      authHandler: auth.handler,
      draftUseCases,
      getSession: (request) =>
        auth.api.getSession({ headers: request.headers }),
      homeUseCases,
      logger,
      promptUseCases,
      readLatestAuthEmail: authEmailPort.readLatestMessage,
      sqliteVersion,
    }),
    close: () => {
      authEmailPort.clear()
      database.close()
    },
    sqliteVersion,
  }
}
