import { migrateDatabase } from "@workspace/database"

import {
  createSeedScriptContext,
  getDevTestUserEmails,
  seedDatabaseWithTestData,
} from "./seed-helpers.js"

const { database, environment, logger } = createSeedScriptContext("seed")

try {
  await migrateDatabase(database.db)
  await seedDatabaseWithTestData(database.db)

  logger.info(
    {
      databasePath: environment.databasePath,
      testUserEmails: getDevTestUserEmails(),
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
  await database.close()
}
