import type { Database } from "bun:sqlite"

export type ApiHealthProbe = Readonly<{
  isDatabaseReady: () => boolean
}>

export function createApiHealthProbe(database: Database): ApiHealthProbe {
  return Object.freeze({
    isDatabaseReady() {
      try {
        database.query("SELECT 1").get()
        return true
      } catch {
        return false
      }
    },
  })
}
