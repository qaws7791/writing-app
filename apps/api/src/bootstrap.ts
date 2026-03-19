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
    databasePath: Bun.env.API_DATABASE_PATH ?? "./data/app.sqlite",
    devUserId: Bun.env.API_DEV_USER_ID ?? "dev-user",
    devUserNickname: Bun.env.API_DEV_USER_NICKNAME ?? "테스트 사용자",
    port: Number(Bun.env.API_PORT ?? "3010"),
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
