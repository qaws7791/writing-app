import {
  createSchema,
  ensureSqliteJsonbSupport,
  openSqliteDatabase,
  seedDatabase,
} from "@workspace/infrastructure"

import { createAuth, ensureAuthTables } from "../auth.js"
import { createAuthEmailPort } from "../auth-email.js"
import { readApiEnvironment } from "../bootstrap.js"

const environment = readApiEnvironment()
const database = openSqliteDatabase(environment.databasePath)
const authEmailPort = createAuthEmailPort()
const auth = createAuth(database, environment, authEmailPort)

try {
  ensureSqliteJsonbSupport(database)
  await ensureAuthTables(auth)
  createSchema(database)
  seedDatabase(database)
  console.log(`Seeded database at ${environment.databasePath}`)
} finally {
  authEmailPort.clear()
  database.close(false)
}
