import {
  createSchema,
  ensureSqliteJsonbSupport,
  openSqliteDatabase,
  resetDatabaseFile,
  seedDatabase,
} from "@workspace/infrastructure"
import { toUserId } from "@workspace/domain"

import { readApiEnvironment } from "../bootstrap.js"

const environment = readApiEnvironment()
resetDatabaseFile(environment.databasePath)

const database = openSqliteDatabase(environment.databasePath)

try {
  ensureSqliteJsonbSupport(database)
  createSchema(database)
  seedDatabase(database, {
    nickname: environment.devUserNickname,
    userId: toUserId(environment.devUserId),
  })
  console.log(`Reset database at ${environment.databasePath}`)
} finally {
  database.close(false)
}
