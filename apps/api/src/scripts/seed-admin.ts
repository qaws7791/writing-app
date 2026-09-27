import { hashAuthPassword } from "@workspace/auth/password"
import { adminAuthAccounts, adminAuthUsers } from "@workspace/auth/schema"
import type { WritingAppDatabase } from "@workspace/db/client"
import { createLocalDatabase } from "@/scripts/local-bindings"
import { eq } from "drizzle-orm"

import {
  createSeedAdminRows,
  type SeedAdminUserInput,
} from "@/scripts/seed-admin-user"

export async function seedAdminUser(
  db: WritingAppDatabase,
  input: SeedAdminUserInput
): Promise<void> {
  validateSeedAdminInput(input)
  const passwordHash = await hashAuthPassword(input.password)
  const rows = createSeedAdminRows({ ...input, passwordHash })
  const existingUser = await db
    .select({ id: adminAuthUsers.id })
    .from(adminAuthUsers)
    .where(eq(adminAuthUsers.id, rows.user.id))
    .get()
  const existingAccount = await db
    .select()
    .from(adminAuthAccounts)
    .where(eq(adminAuthAccounts.id, rows.account.id))
    .get()
  if (existingUser === undefined && existingAccount === undefined) {
    await db.batch([
      db.insert(adminAuthUsers).values(rows.user),
      db.insert(adminAuthAccounts).values(rows.account),
    ])
    return
  }
  if (
    existingUser === undefined ||
    existingAccount === undefined ||
    existingAccount.accountId !== rows.account.accountId ||
    existingAccount.providerId !== rows.account.providerId ||
    existingAccount.userId !== rows.account.userId ||
    existingAccount.password === null
  ) {
    throw new Error("기존 seed 관리자 상태가 credential과 일치하지 않습니다.")
  }
  if (input.resetPassword === true) {
    await db
      .update(adminAuthAccounts)
      .set({
        password: rows.account.password,
        updatedAt: rows.account.updatedAt,
      })
      .where(eq(adminAuthAccounts.id, rows.account.id))
      .run()
  }
}

export function parseSeedAdminEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): SeedAdminUserInput {
  const input = {
    email: requireEnvironmentValue(
      environment["ADMIN_SEED_EMAIL"],
      "ADMIN_SEED_EMAIL"
    ),
    password: requireEnvironmentValue(
      environment["ADMIN_SEED_PASSWORD"],
      "ADMIN_SEED_PASSWORD"
    ),
    name: environment["ADMIN_SEED_NAME"]?.trim() || "관리자",
    now: new Date(),
    resetPassword: environment["ADMIN_SEED_RESET_PASSWORD"] === "true",
  }
  validateSeedAdminInput(input)
  return input
}

export function validateSeedAdminInput(input: SeedAdminUserInput): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    throw new Error("ADMIN_SEED_EMAIL은 유효한 이메일 주소여야 합니다.")
  }

  const passwordClasses = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(
    (pattern) => pattern.test(input.password)
  ).length
  const isPlaceholder = [
    "replace-with-local-admin-password",
    "replace-with-admin-password",
    "change-me",
    "changeme",
  ].includes(input.password.toLowerCase())

  if (input.password.length < 16 || passwordClasses < 3 || isPlaceholder) {
    throw new Error(
      "ADMIN_SEED_PASSWORD는 16자 이상이며 문자 종류를 3개 이상 포함하고 placeholder가 아니어야 합니다."
    )
  }
}

function requireEnvironmentValue(
  value: string | undefined,
  name: "ADMIN_SEED_EMAIL" | "ADMIN_SEED_PASSWORD"
): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`${name}을 명시해야 합니다.`)
  }
  return value.trim()
}

if (import.meta.main) {
  const command = parseSeedAdminEnvironment(process.env)
  const client = await createLocalDatabase()
  try {
    await seedAdminUser(client.db, command)
  } finally {
    await client.close()
  }
}
