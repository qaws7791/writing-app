import { fileURLToPath } from "node:url"

import { Database, type SQLQueryBindings, type Statement } from "bun:sqlite"
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite"

type SqliteSchema = Readonly<Record<string, unknown>>
type TrackedStatementResource = {
  finalized: boolean
  readonly onFinalize?: () => void
  readonly statement: Statement
  token: WeakRef<object> | undefined
}
type StatementTracker = Readonly<{
  finalizationErrors: unknown[]
  registry: FinalizationRegistry<TrackedStatementResource>
  resources: Set<TrackedStatementResource>
}>

export type SqliteDatabaseClient<TSchema extends SqliteSchema> = {
  readonly close: () => void
  readonly db: BunSQLiteDatabase<TSchema>
  readonly sqlite: Database
}

export type CreateSqliteDatabaseInput<TSchema extends SqliteSchema> = {
  readonly filename: string
  readonly mode?: "read-only" | "read-write"
  readonly schema: TSchema
}

export function createSqliteDatabase<TSchema extends SqliteSchema>(
  input: CreateSqliteDatabaseInput<TSchema>
): SqliteDatabaseClient<TSchema> {
  const readOnly = input.mode === "read-only"
  const nativeSqlite = new Database(normalizeSqliteFilename(input.filename), {
    ...(readOnly ? { readonly: true } : { create: true }),
  })
  const tracker = createStatementTracker()
  const sqlite = createTrackedSqliteClient(nativeSqlite, tracker)
  let closed = false

  sqlite.exec("PRAGMA foreign_keys = ON")
  sqlite.exec("PRAGMA busy_timeout = 5000")

  if (!readOnly) {
    sqlite.exec("PRAGMA journal_mode = WAL")
    sqlite.exec("PRAGMA synchronous = NORMAL")
  }

  const db = drizzle(sqlite, { schema: input.schema })

  return {
    close() {
      if (closed) return

      closeSqliteDatabase(nativeSqlite, tracker)
      closed = true
    },
    db,
    sqlite,
  }
}

export function runInSqliteTransaction<TDatabase, TValue>(
  database: {
    readonly transaction: (
      operation: (transaction: TDatabase) => TValue
    ) => TValue
  },
  operation: (transaction: TDatabase) => TValue
): TValue {
  return database.transaction(operation)
}

function normalizeSqliteFilename(filename: string): string {
  if (filename.startsWith("file://")) {
    return fileURLToPath(filename)
  }

  if (filename.startsWith("file:")) {
    return filename.slice("file:".length)
  }

  return filename
}

function createStatementTracker(): StatementTracker {
  const resources = new Set<TrackedStatementResource>()
  const finalizationErrors: unknown[] = []

  return {
    finalizationErrors,
    registry: new FinalizationRegistry((resource) => {
      try {
        finalizeStatementResource(resource, resources)
      } catch (error) {
        finalizationErrors.push(error)
      }
    }),
    resources,
  }
}

function createTrackedSqliteClient(
  sqlite: Database,
  tracker: StatementTracker
): Database {
  const queryCache = new Map<string, Statement>()
  const query = (sql: string) => {
    const cachedStatement = queryCache.get(sql)
    if (cachedStatement !== undefined) {
      return cachedStatement
    }

    const statement = trackStatement(tracker, sqlite.query(sql), () => {
      queryCache.delete(sql)
    })
    queryCache.set(sql, statement)
    return statement
  }
  const prepare = (
    sql: string,
    params?: SQLQueryBindings | SQLQueryBindings[]
  ) => trackStatement(tracker, sqlite.prepare(sql, params))

  return new Proxy(sqlite, {
    get(target, property) {
      if (property === "query") {
        return query
      }
      if (property === "prepare") {
        return prepare
      }

      const value: unknown = Reflect.get(target, property, target)
      return typeof value === "function" ? value.bind(target) : value
    },
  })
}

function trackStatement<TStatement extends Statement>(
  tracker: StatementTracker,
  statement: TStatement,
  onFinalize?: () => void
): TStatement {
  const resource: TrackedStatementResource = {
    finalized: false,
    onFinalize,
    statement,
    token: undefined,
  }
  const finalize = () => {
    finalizeStatementResource(resource, tracker.resources)
    const token = resource.token?.deref()
    if (token !== undefined) {
      tracker.registry.unregister(token)
    }
  }
  const trackedStatement = new Proxy(statement, {
    get(target, property) {
      if (property === "finalize" || property === Symbol.dispose) {
        return finalize
      }

      const value: unknown = Reflect.get(target, property, target)
      return typeof value === "function" ? value.bind(target) : value
    },
  })

  resource.token = new WeakRef(trackedStatement)
  tracker.resources.add(resource)
  tracker.registry.register(trackedStatement, resource, trackedStatement)

  return trackedStatement
}

function finalizeStatementResource(
  resource: TrackedStatementResource,
  resources: Set<TrackedStatementResource>
): void {
  if (resource.finalized) return

  resource.statement.finalize()
  resource.finalized = true
  resources.delete(resource)
  resource.onFinalize?.()
}

function closeSqliteDatabase(
  sqlite: Database,
  tracker: StatementTracker
): void {
  const errors = tracker.finalizationErrors.splice(0)
  const resources = [...tracker.resources]
  const failedResources: TrackedStatementResource[] = []
  tracker.resources.clear()

  for (const resource of resources) {
    try {
      finalizeStatementResource(resource, tracker.resources)
    } catch (error) {
      errors.push(error)
      if (!resource.finalized) {
        failedResources.push(resource)
      }
    } finally {
      if (resource.finalized) {
        const token = resource.token?.deref()
        if (token !== undefined) {
          tracker.registry.unregister(token)
        }
      }
    }
  }
  for (const resource of failedResources) {
    tracker.resources.add(resource)
  }

  try {
    sqlite.close(true)
  } catch (error) {
    errors.push(error)
  }

  if (errors.length === 1) {
    throw errors[0]
  }

  if (errors.length > 1) {
    throw new AggregateError(errors, "SQLite 데이터베이스를 닫지 못했습니다.")
  }
}
