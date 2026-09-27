import type { D1Database } from "@cloudflare/workers-types"

export type SqlValue = string | number | null | ArrayBuffer | Uint8Array
export type SqlDatabaseClient = Readonly<{
  binding: D1Database
  query: <T, P extends SqlValue[] = SqlValue[]>(
    sql: string
  ) => {
    all: (...parameters: P) => Promise<T[]>
    get: (...parameters: P) => Promise<T | null>
    run: (...parameters: P) => Promise<void>
  }
  exec: (sql: string) => Promise<void>
}>

export function createSqlDatabaseClient(
  binding: D1Database
): SqlDatabaseClient {
  return {
    binding,
    query<T, P extends SqlValue[] = SqlValue[]>(sql: string) {
      return {
        async all(...parameters: P): Promise<T[]> {
          return (
            await binding
              .prepare(sql)
              .bind(...parameters)
              .all<T>()
          ).results
        },
        get: (...parameters: P) =>
          binding
            .prepare(sql)
            .bind(...parameters)
            .first<T>(),
        async run(...parameters: P): Promise<void> {
          await binding
            .prepare(sql)
            .bind(...parameters)
            .run()
        },
      }
    },
    async exec(sql) {
      await binding.prepare(sql).run()
    },
  }
}
