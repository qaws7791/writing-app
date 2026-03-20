import {
  createSchema,
  ensureSqliteJsonbSupport,
  openSqliteDatabase,
  seedDatabase,
} from "@workspace/infrastructure"

import { createAuth, ensureAuthTables } from "../auth.js"
import { createAuthEmailPort } from "../auth-email.js"
import { readApiEnvironment } from "../bootstrap.js"
import { createApiLogger } from "../logger.js"

const environment = readApiEnvironment()
const logger = createApiLogger({
  level: environment.logLevel,
}).child({
  script: "seed",
})

const database = openSqliteDatabase(environment.databasePath)
const authEmailPort = createAuthEmailPort({
  exposeSensitiveData: process.env.NODE_ENV === "development",
  logger: logger.child({
    scope: "auth-email",
  }),
})
const auth = createAuth(database, environment, authEmailPort)

try {
  ensureSqliteJsonbSupport(database)
  await ensureAuthTables(auth)
  createSchema(database)
  seedDatabase(database)
  logger.info(
    {
      databasePath: environment.databasePath,
    },
    "database seed completed"
  )
} catch (error) {
  logger.error(
    error instanceof Error ? { err: error } : { error },
    "database seed failed"
  )
  throw error
} finally {
  authEmailPort.clear()
  database.close(false)
}
