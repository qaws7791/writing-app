export type RepositoryTransactionScope = Record<never, never>

export interface RepositoryTransactionManager {
  run<T>(work: (scope: RepositoryTransactionScope) => Promise<T>): Promise<T>
}
