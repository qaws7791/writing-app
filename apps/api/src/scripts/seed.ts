import { migrateDatabase, openDb, seedDatabase } from "@workspace/database"

import { readApiEnvironment } from "../runtime/bootstrap.js"
import { createApiLogger } from "../observability/logger.js"

const environment = readApiEnvironment()
const logger = createApiLogger({
  level: environment.logLevel,
}).child({
  script: "seed",
})

const database = openDb(environment.databasePath)

try {
  await migrateDatabase(database.db)
  seedDatabase(database.db)
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
  database.close()
}
