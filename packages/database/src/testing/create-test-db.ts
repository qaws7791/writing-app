import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"

import { migrateDatabase } from "../connection/migrate"
import { seedDatabase } from "../connection/seed"
import { schema } from "../schema/index"
import { user } from "../schema/auth"
import type { DbClient } from "../types/index"

export type TestDatabase = {
  cleanup: () => Promise<void>
  db: DbClient
}

export async function createTestDb(): Promise<TestDatabase> {
  const connectionUrl =
    process.env.TEST_DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/geulpil_test"

  const sql = postgres(connectionUrl)
  const db = drizzle({ client: sql, schema })

  await migrateDatabase(db)
  await seedDatabase(db)

  await db
    .insert(user)
    .values({
      createdAt: new Date("2026-03-21T00:00:00.000Z"),
      email: "dev-user@example.com",
      emailVerified: true,
      id: "dev-user",
      name: "테스트 사용자",
      updatedAt: new Date("2026-03-21T00:00:00.000Z"),
    })
    .onConflictDoNothing()

  return {
    cleanup: () => sql.end(),
    db,
  }
}
