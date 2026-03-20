import {
  createDraftUseCases,
  createHomeUseCases,
  createPromptUseCases,
} from "@workspace/application"
import {
  closeSqliteDatabase,
  createSchema,
  ensureSqliteJsonbSupport,
  openSqliteDatabase,
  seedDatabase,
  SqliteDraftRepository,
  SqlitePromptRepository,
} from "@workspace/infrastructure"

import { createApp } from "./app.js"
import { createAuth, ensureAuthTables } from "./auth.js"
import { createAuthEmailPort } from "./auth-email.js"
import { apiEnv } from "./env.js"

export type ApiEnvironment = {
  authBaseUrl: string
  authSecret: string
  databasePath: string
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
    databasePath: apiEnv.API_DATABASE_PATH,
    port: apiEnv.API_PORT,
    webBaseUrl: apiEnv.API_WEB_BASE_URL,
  }
}

export async function createApiDependencies(
  environment: ApiEnvironment
): Promise<AppDependencies> {
  const database = openSqliteDatabase(environment.databasePath)
  const { sqliteVersion } = ensureSqliteJsonbSupport(database)
  const authEmailPort = createAuthEmailPort()
  const auth = createAuth(database, environment, authEmailPort)

  await ensureAuthTables(auth)
  createSchema(database)
  seedDatabase(database)

  const promptRepository = new SqlitePromptRepository(database)
  const draftRepository = new SqliteDraftRepository(database)

  const promptUseCases = createPromptUseCases(promptRepository)
  const draftUseCases = createDraftUseCases(draftRepository, promptRepository)
  const homeUseCases = createHomeUseCases(draftRepository, promptRepository)

  return {
    app: createApp({
      allowedOrigins: [environment.webBaseUrl],
      authDebugEnabled: process.env.NODE_ENV !== "production",
      authHandler: auth.handler,
      draftUseCases,
      getSession: (request) =>
        auth.api.getSession({ headers: request.headers }),
      homeUseCases,
      promptUseCases,
      readLatestAuthEmail: authEmailPort.readLatestMessage,
      sqliteVersion,
    }),
    close: () => {
      authEmailPort.clear()
      closeSqliteDatabase(database)
    },
    sqliteVersion,
  }
}
