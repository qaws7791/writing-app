import { mkdtempSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import {
  migrateDatabase,
  openDb,
  type OpenedDb,
  seedDatabase,
} from "../connection/index.js"
import { user } from "../schema/index.js"

type CreateTestDbOptions = {
  withTestUser?: boolean
}

export type TestDatabase = OpenedDb & {
  cleanup: () => void
  path: string
}

export async function createTestDb(
  options: CreateTestDbOptions = {}
): Promise<TestDatabase> {
  const { withTestUser = true } = options
  const root = mkdtempSync(join(tmpdir(), "writing-db-"))
  const path = join(root, "test.sqlite")
  const database = openDb(path)
  const cleanup = () => {
    database.close()
  }

  await migrateDatabase(database.db)
  seedDatabase(database.db)

  if (withTestUser) {
    const now = new Date("2026-03-21T00:00:00.000Z")
    database.db
      .insert(user)
      .values({
        createdAt: now,
        email: "dev-user@example.com",
        emailVerified: true,
        id: "dev-user",
        image: null,
        name: "테스트 사용자",
        updatedAt: now,
      })
      .run()
  }

  return {
    ...database,
    cleanup,
    path,
  }
}
