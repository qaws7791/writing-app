import { hashAuthPassword } from "@workspace/auth/password"
import {
  adminAuthAccounts,
  adminAuthUsers,
  authAccounts,
  authUsers,
} from "@workspace/auth/schema"
import { createLocalDatabase } from "@/scripts/local-bindings"
import {
  e2eSeededCredentials,
  e2eSeededLearnerActors,
} from "@workspace/env/e2e-runtime"
import { learnerProfiles } from "@workspace/identity/migration-schema"

const { adminPassword, learnerPassword } = e2eSeededCredentials

export async function setupE2eAuthDatabase(persistPath: string): Promise<void> {
  const database = await createLocalDatabase(persistPath)
  try {
    const now = new Date("2026-07-12T00:00:00.000Z")
    const password = await hashAuthPassword(adminPassword)
    const admins = [
      {
        email: "owner@example.test",
        id: "e2e-owner",
        name: "E2E 소유자",
      },
    ] as const

    await database.db.insert(adminAuthUsers).values(
      admins.map((admin) => ({
        ...admin,
        createdAt: now,
        emailVerified: true,
        image: null,
        updatedAt: now,
      }))
    )
    await database.db.insert(adminAuthAccounts).values(
      admins.map((admin) => ({
        accountId: admin.id,
        createdAt: now,
        id: `${admin.id}-credential`,
        password,
        providerId: "credential",
        updatedAt: now,
        userId: admin.id,
      }))
    )
    const learnerActors = Object.values(e2eSeededLearnerActors)
    await database.db.insert(authUsers).values(
      learnerActors.map((actor) => ({
        ...actor,
        createdAt: now,
        emailVerified: true,
        image: null,
        updatedAt: now,
      }))
    )
    const learnerPasswordHash = await hashAuthPassword(learnerPassword)
    await database.db.insert(authAccounts).values({
      accountId: "user-1",
      createdAt: now,
      id: "e2e-learner-credential",
      password: learnerPasswordHash,
      providerId: "credential",
      updatedAt: now,
      userId: "user-1",
    })
    await database.db.insert(authAccounts).values(
      learnerActors.map((actor) => ({
        accountId: actor.id,
        createdAt: now,
        id: `${actor.id}-credential`,
        password: learnerPasswordHash,
        providerId: "credential",
        updatedAt: now,
        userId: actor.id,
      }))
    )
    await database.db.insert(learnerProfiles).values(
      learnerActors.map((actor) => ({
        deletedAt: null,
        displayName: actor.name,
        status: "active" as const,
        userId: actor.id,
        version: 0,
      }))
    )
  } finally {
    await database.close()
  }
}
