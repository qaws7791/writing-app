import type { SqlDatabaseClient as Database } from "@workspace/db/sql-client"

export type ApiHealthProbe = Readonly<{
  isDatabaseReady: () => Promise<boolean>
}>

export function createApiHealthProbe(database: Database): ApiHealthProbe {
  return {
    async isDatabaseReady() {
      try {
        await database.query("SELECT 1").get()
        return true
      } catch {
        return false
      }
    },
  }
}
