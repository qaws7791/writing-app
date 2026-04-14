import { openDb } from "@workspace/database"

import { env } from "@/env"

let dbInstance: ReturnType<typeof openDb> | null = null

export function getDb() {
  if (!dbInstance) {
    dbInstance = openDb(env.DATABASE_URL)
  }
  return dbInstance.db
}
