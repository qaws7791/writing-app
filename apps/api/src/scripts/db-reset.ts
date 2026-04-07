import { hashPassword } from "better-auth/crypto"

import {
  migrateDatabase,
  openDb,
  resetDatabase,
  seedDatabase,
  seedTestUsers,
  type SeedTestUser,
} from "@workspace/database"

import { readApiEnvironment } from "../runtime/bootstrap.js"
import { createApiLogger } from "../observability/logger.js"

const DEV_TEST_USERS = [
  {
    email: "test@example.com",
    name: "테스트 사용자",
    password: "testpassword1234",
  },
] as const

const environment = readApiEnvironment()
const logger = createApiLogger({
  level: environment.logLevel,
}).child({
  script: "db-reset",
})

const database = openDb(environment.databasePath)

try {
  await migrateDatabase(database.db)
  await resetDatabase(database.db)
  seedDatabase(database.db)

  const testUserSeeds: SeedTestUser[] = await Promise.all(
    DEV_TEST_USERS.map(async (u, i) => ({
      accountRecordId: `dev-account-${i + 1}`,
      email: u.email,
      name: u.name,
      passwordHash: await hashPassword(u.password),
      userId: `dev-user-${i + 1}`,
    }))
  )
  seedTestUsers(database.db, testUserSeeds)

  logger.info(
    {
      databasePath: environment.databasePath,
      testUserEmails: DEV_TEST_USERS.map((u) => u.email),
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
