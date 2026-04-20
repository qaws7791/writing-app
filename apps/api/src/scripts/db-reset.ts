import { migrateDatabase, resetDatabase } from "@workspace/database"

import {
  createSeedScriptContext,
  getDevTestUserEmails,
  seedDatabaseWithTestData,
} from "./seed-helpers.js"

const { database, environment, logger } = createSeedScriptContext("db-reset")

try {
  await migrateDatabase(database.db)
  await resetDatabase(database.db)
  await seedDatabaseWithTestData(database.db)

  logger.info(
    {
      databasePath: environment.databasePath,
      testUserEmails: getDevTestUserEmails(),
    },
    "database reset completed"
  )
} catch (error) {
  logger.error(
    error instanceof Error ? { err: error } : { error },
    "database reset failed"
  )
  throw error
} finally {
  await database.close()
}
