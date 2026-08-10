import { adminAuthUsers } from "@workspace/auth/schema"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { afterEach, describe, expect, it } from "vitest"

import { findMissingAdminAuthUserIds } from "@/adapters/auth/admin-auth-user-reader"
import { runApplicationMigrations } from "@/db/migrate"

describe("findMissingAdminAuthUserIds", () => {
  const clients: ReturnType<typeof createInMemoryWritingAppDatabase>[] = []

  afterEach(() => {
    for (const client of clients.splice(0)) client.close()
  })

  it("returns only distinct admin IDs that are not present", () => {
    const client = createInMemoryWritingAppDatabase()
    clients.push(client)
    runApplicationMigrations(client.sqlite)
    const existingAdminId = adminIdSchema.parse("admin-existing")
    const missingAdminId = adminIdSchema.parse("admin-missing")
    const now = new Date("2026-08-10T00:00:00.000Z")
    client.db
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
      findMissingAdminAuthUserIds(client.db, [
        existingAdminId,
        missingAdminId,
        missingAdminId,
      ])
    ).toEqual([missingAdminId])
  })

  it("does not query an empty owner list", () => {
    const client = createInMemoryWritingAppDatabase()
    clients.push(client)

    expect(findMissingAdminAuthUserIds(client.db, [])).toEqual([])
  })
})
