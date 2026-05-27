import Database from "bun:sqlite"
import { hashPassword } from "better-auth/crypto"

import {
  adminAccount,
  adminUser,
  createDatabase,
  runContentMigration,
  type WritingAppDatabase,
} from "@workspace/db"

import { ensureDatabaseDirectory, parseAdminApiEnv } from "@/env"

export type SeedAdminUserResult =
  | {
      status: "created"
    }
  | {
      status: "already-exists"
    }

interface SeedAdminUserInput {
  email: string
  name: string
  password: string
}

export async function seedAdminUser(
  db: WritingAppDatabase,
  input: SeedAdminUserInput
): Promise<SeedAdminUserResult> {
  const existingUser = await db.query.adminUser.findFirst({
    where: (user, { eq }) => eq(user.email, input.email),
  })

  if (existingUser) {
    return { status: "already-exists" }
  }

  const now = new Date()
  const userId = crypto.randomUUID()
  const passwordHash = await hashPassword(input.password)

  await db.transaction(async (tx) => {
    await tx.insert(adminUser).values({
      createdAt: now,
      email: input.email,
      emailVerified: true,
      id: userId,
      name: input.name,
      updatedAt: now,
    })

    await tx.insert(adminAccount).values({
      accountId: userId,
      createdAt: now,
      id: crypto.randomUUID(),
      password: passwordHash,
      providerId: "credential",
      updatedAt: now,
      userId,
    })
  })

  return { status: "created" }
}

function parseRequiredSeedValue(
  env: Record<string, string | undefined>,
  name: "ADMIN_SEED_EMAIL" | "ADMIN_SEED_PASSWORD"
) {
  const value = env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

async function runSeedAdminScript() {
  const env = parseAdminApiEnv(Bun.env)

  ensureDatabaseDirectory(env.databasePath)
  const sqlite = new Database(env.databasePath, { create: true })
  try {
    runContentMigration(sqlite)

    const result = await seedAdminUser(createDatabase(sqlite), {
      email: parseRequiredSeedValue(Bun.env, "ADMIN_SEED_EMAIL"),
      name: Bun.env["ADMIN_SEED_NAME"] || "관리자",
      password: parseRequiredSeedValue(Bun.env, "ADMIN_SEED_PASSWORD"),
    })

    // eslint-disable-next-line no-console
    console.info(JSON.stringify(result))
  } finally {
    sqlite.close()
  }
}

if (import.meta.main) {
  await runSeedAdminScript()
}
