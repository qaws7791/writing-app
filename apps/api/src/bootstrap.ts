import {
  createDraftUseCases,
  createHomeUseCases,
  createPromptUseCases,
} from "@workspace/application"
import { toUserId } from "@workspace/domain"
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
import { apiEnv } from "./env.js"

export type ApiEnvironment = {
  databasePath: string
  devUserId: string
  devUserNickname: string
  port: number
}

export type AppDependencies = {
  app: ReturnType<typeof createApp>
  close: () => void
  sqliteVersion: string
}

export function readApiEnvironment(): ApiEnvironment {
  return {
    databasePath: apiEnv.API_DATABASE_PATH,
    devUserId: apiEnv.API_DEV_USER_ID,
    devUserNickname: apiEnv.API_DEV_USER_NICKNAME,
    port: apiEnv.API_PORT,
  }
}

export function createApiDependencies(
  environment: ApiEnvironment
): AppDependencies {
  const database = openSqliteDatabase(environment.databasePath)
  const { sqliteVersion } = ensureSqliteJsonbSupport(database)

  createSchema(database)
  seedDatabase(database, {
    nickname: environment.devUserNickname,
    userId: toUserId(environment.devUserId),
  })

  const promptRepository = new SqlitePromptRepository(database)
  const draftRepository = new SqliteDraftRepository(database)

  const promptUseCases = createPromptUseCases(promptRepository)
  const draftUseCases = createDraftUseCases(draftRepository, promptRepository)
  const homeUseCases = createHomeUseCases(draftRepository, promptRepository)

  return {
    app: createApp({
      draftUseCases,
      homeUseCases,
      promptUseCases,
      sqliteVersion,
      userId: environment.devUserId,
    }),
    close: () => closeSqliteDatabase(database),
    sqliteVersion,
  }
}
