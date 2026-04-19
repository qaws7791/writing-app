import type {
  RepositoryTransactionManager,
  RepositoryTransactionScope,
} from "@workspace/core"

import { createJourneyRepository } from "../repository/journey.repository"
import { createProgressRepository } from "../repository/progress.repository"
import { createWritingPromptRepository } from "../repository/writing-prompt.repository"
import { createWritingRepository } from "../repository/writing.repository"
import { runInTransaction } from "./run-in-transaction"
import type { DbClient } from "../types/index"

function createRepositoryTransactionScope(
  database: DbClient
): RepositoryTransactionScope {
  return {
    journeyRepository: createJourneyRepository(database),
    progressRepository: createProgressRepository(database),
    promptRepository: createWritingPromptRepository(database),
    writingRepository: createWritingRepository(database),
  }
}

export function createRepositoryTransactionManager(
  database: DbClient
): RepositoryTransactionManager {
  return {
    run<T>(
      work: (scope: RepositoryTransactionScope) => Promise<T>
    ): Promise<T> {
      return runInTransaction(database, () =>
        work(createRepositoryTransactionScope(database))
      )
    },
  }
}
