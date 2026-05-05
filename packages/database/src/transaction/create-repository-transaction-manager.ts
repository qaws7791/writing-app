import type {
  RepositoryTransactionManager,
  RepositoryTransactionScope,
} from "@workspace/core/shared"

import { runInTransaction } from "./run-in-transaction"
import type { DbClient } from "../types/index"

export function createRepositoryTransactionManager(
  database: DbClient
): RepositoryTransactionManager {
  return {
    run<T>(
      work: (scope: RepositoryTransactionScope) => Promise<T>
    ): Promise<T> {
      return runInTransaction(database, () => work({}))
    },
  }
}
