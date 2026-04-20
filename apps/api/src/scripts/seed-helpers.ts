import { hashPassword } from "better-auth/crypto"

import {
  openDb,
  seedDatabase,
  seedTestUsers,
  type DbClient,
  type OpenedDb,
  type SeedTestUser,
} from "@workspace/database"
import journeySeeds from "../../data/journey-seeds.json"

import { createApiLogger } from "../observability/logger.js"
import {
  readApiEnvironment,
  type ApiEnvironment,
} from "../runtime/bootstrap.js"

const DEV_TEST_USERS = [
  {
    email: "test@example.com",
    name: "테스트 사용자",
    password: "testpassword1234",
  },
] as const

export type SeedScriptContext = {
  database: OpenedDb
  environment: ApiEnvironment
  logger: ReturnType<typeof createApiLogger>
}

export function createSeedScriptContext(script: string): SeedScriptContext {
  const environment = readApiEnvironment()
  const logger = createApiLogger({
    level: environment.logLevel,
  }).child({
    script,
  })

  return {
    database: openDb(environment.databasePath),
    environment,
    logger,
  }
}

export async function seedDatabaseWithTestData(database: DbClient) {
  await seedDatabase(database, journeySeeds.journeys)
  await seedTestUsers(database, await buildTestUserSeeds())
}

export function getDevTestUserEmails() {
  return DEV_TEST_USERS.map((user) => user.email)
}

async function buildTestUserSeeds(): Promise<SeedTestUser[]> {
  return Promise.all(
    DEV_TEST_USERS.map(async (user, index) => ({
      accountRecordId: `dev-account-${index + 1}`,
      email: user.email,
      name: user.name,
      passwordHash: await hashPassword(user.password),
      userId: `dev-user-${index + 1}`,
    }))
  )
}
