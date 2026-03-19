import { toUserId } from "@workspace/domain"
import {
  createSchema,
  ensureSqliteJsonbSupport,
  openSqliteDatabase,
  seedDatabase,
} from "@workspace/infrastructure"

import { readApiEnvironment } from "../bootstrap.js"

const environment = readApiEnvironment()
const database = openSqliteDatabase(environment.databasePath)

try {
  ensureSqliteJsonbSupport(database)
  createSchema(database)
  seedDatabase(database, {
    nickname: environment.devUserNickname,
    userId: toUserId(environment.devUserId),
  })
  console.log(`Seeded database at ${environment.databasePath}`)
} finally {
  database.close(false)
}
