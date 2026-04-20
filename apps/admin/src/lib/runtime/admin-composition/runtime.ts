import {
  createJourneyRepository,
  createRepositoryTransactionManager,
  createWritingPromptRepository,
  openDb,
} from "@workspace/database"

import { env } from "@/env"

export function createAdminInfrastructure() {
  const database = openDb(env.DATABASE_URL)
  const promptRepository = createWritingPromptRepository(database.db)
  const journeyRepository = createJourneyRepository(database.db)
  const transactionManager = createRepositoryTransactionManager(database.db)

  return {
    database,
    journeyRepository,
    promptRepository,
    transactionManager,
  }
}
