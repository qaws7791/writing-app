import { describe, expect, it } from "vitest"
import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import { authSessions, authUsers } from "@workspace/auth/schema"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"

import { createIdentitySessionRevocation } from "@/adapters/auth/identity-session-revocation"
import { runApplicationMigrations } from "@/db/migrate"

const now = new Date("2026-07-22T00:00:00.000Z")

describe("identity auth session revocation adapter", () => {
  it("제품 ID만 받아 learner session을 폐기한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runApplicationMigrations(client.sqlite)
      seedAuthUsers(client)
      const port = createIdentitySessionRevocation(client.db)

      expect(
        (await port.revokeLearnerSessions(userIdSchema.parse("user-1"))).isOk()
      ).toBe(true)
      expect(client.db.select().from(authSessions).all()).toEqual([])
    } finally {
      client.close()
    }
  })

  it("저장소 실패를 concrete error 대신 identity Result로 격리한다", async () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      const port = createIdentitySessionRevocation(client.db)

      await expect(
        port.revokeLearnerSessions(userIdSchema.parse("user-1"))
      ).resolves.toMatchObject({
        error: { kind: "session-revocation-failed" },
      })
    } finally {
      client.close()
    }
  })
})

function seedAuthUsers(
  client: ReturnType<typeof createInMemoryWritingAppDatabase>
): void {
  client.db
    .insert(authUsers)
    .values({
      createdAt: now,
      email: "learner@example.com",
      emailVerified: true,
      id: "user-1",
      name: "학습자",
      updatedAt: now,
    })
    .run()
  client.db
    .insert(authSessions)
    .values({
      createdAt: now,
      expiresAt: new Date("2099-01-01T00:00:00.000Z"),
      id: "learner-session",
      token: "learner-token",
      updatedAt: now,
      userId: "user-1",
    })
    .run()
}
