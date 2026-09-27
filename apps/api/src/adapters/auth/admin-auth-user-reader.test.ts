import { adminAuthUsers } from "@workspace/auth/schema"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { createInMemoryWritingAppDatabase } from "@workspace/db/test-support/d1-database"

import { afterEach, describe, expect, it } from "vitest"

import { findMissingAdminAuthUserIds } from "@/adapters/auth/admin-auth-user-reader"
import { runCurrentTestMigration as runApplicationMigrations } from "@workspace/db/test-support/application-migration"

describe("findMissingAdminAuthUserIds", () => {
  const clients: Awaited<
    ReturnType<typeof createInMemoryWritingAppDatabase>
  >[] = []

  afterEach(async () => {
    for (const client of clients.splice(0)) await client.close()
  })

  it("returns only distinct admin IDs that are not present", async () => {
    const client = await createInMemoryWritingAppDatabase()
    clients.push(client)
    await runApplicationMigrations(client.sqlite)
    const existingAdminId = adminIdSchema.parse("admin-existing")
    const missingAdminId = adminIdSchema.parse("admin-missing")
    const now = new Date("2026-08-10T00:00:00.000Z")
    await client.db
      .insert(adminAuthUsers)
      .values({
        createdAt: now,
        email: "existing-admin@example.test",
        emailVerified: true,
        id: existingAdminId,
        name: "Existing Admin",
        updatedAt: now,
      })
      .run()

    expect(
      await findMissingAdminAuthUserIds(client.db, [
        existingAdminId,
        missingAdminId,
        missingAdminId,
      ])
    ).toEqual([missingAdminId])
  })

  it("does not query an empty owner list", async () => {
    const client = await createInMemoryWritingAppDatabase()
    clients.push(client)

    expect(await findMissingAdminAuthUserIds(client.db, [])).toEqual([])
  })
})
