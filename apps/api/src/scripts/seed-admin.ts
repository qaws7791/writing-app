import { hashAuthPassword } from "@workspace/auth/password"
import { adminAuthAccounts, adminAuthUsers } from "@workspace/auth/schema"
import {
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
  type WritingAppDatabase,
} from "@workspace/db/client"
import { eq } from "drizzle-orm"

import { runApplicationMigrations } from "@/db/migrate"
import {
  createSeedAdminRows,
  type SeedAdminUserInput,
} from "@/scripts/seed-admin-user"

export function seedAdminUser(
  db: WritingAppDatabase,
  input: SeedAdminUserInput
): Promise<void> {
  validateSeedAdminInput(input)

  return hashAuthPassword(input.password).then((passwordHash) =>
    db.transaction((transaction) => {
      const rows = createSeedAdminRows({ ...input, passwordHash })
      const existingUser = transaction
        .select({ id: adminAuthUsers.id })
        .from(adminAuthUsers)
        .where(eq(adminAuthUsers.id, rows.user.id))
        .get()
      const existingAccount = transaction
        .select({
          accountId: adminAuthAccounts.accountId,
          id: adminAuthAccounts.id,
          password: adminAuthAccounts.password,
          providerId: adminAuthAccounts.providerId,
          userId: adminAuthAccounts.userId,
        })
        .from(adminAuthAccounts)
        .where(eq(adminAuthAccounts.id, rows.account.id))
        .get()
      if (existingUser === undefined && existingAccount === undefined) {
        transaction.insert(adminAuthUsers).values(rows.user).run()
        transaction.insert(adminAuthAccounts).values(rows.account).run()
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
        throw new Error(
          "기존 seed 관리자 상태가 불완전하거나 credential과 일치하지 않습니다."
        )
      }

      if (input.resetPassword !== true) return

      transaction
        .update(adminAuthAccounts)
        .set({
          password: rows.account.password,
          updatedAt: rows.account.updatedAt,
        })
        .where(eq(adminAuthAccounts.id, rows.account.id))
        .run()
    })
  )
}

export type SeedAdminEnvironment = {
  readonly ADMIN_SEED_EMAIL?: string
  readonly ADMIN_SEED_EXPECTED_DATABASE_URL?: string
  readonly ADMIN_SEED_NAME?: string
  readonly ADMIN_SEED_PASSWORD?: string
  readonly ADMIN_SEED_PRODUCTION_APPROVED?: string
  readonly ADMIN_SEED_RESET_PASSWORD?: string
  readonly DATABASE_URL?: string
  readonly NODE_ENV?: string
}

export function parseSeedAdminEnvironment(environment: SeedAdminEnvironment): {
  readonly databaseUrl: string
  readonly input: SeedAdminUserInput
} {
  const databaseUrl = environment.DATABASE_URL ?? getDefaultDatabaseUrl()
  const email = requireEnvironmentValue(
    environment.ADMIN_SEED_EMAIL,
    "ADMIN_SEED_EMAIL"
  )
  const password = requireEnvironmentValue(
    environment.ADMIN_SEED_PASSWORD,
    "ADMIN_SEED_PASSWORD"
  )

  if (environment.NODE_ENV === "production") {
    if (environment.ADMIN_SEED_PRODUCTION_APPROVED !== "true") {
      throw new Error(
        "운영 owner seed에는 ADMIN_SEED_PRODUCTION_APPROVED=true가 필요합니다."
      )
    }
    if (environment.DATABASE_URL === undefined) {
      throw new Error("운영 owner seed에는 명시적인 DATABASE_URL이 필요합니다.")
    }
    if (environment.ADMIN_SEED_EXPECTED_DATABASE_URL !== databaseUrl) {
      throw new Error(
        "운영 owner seed 대상 DATABASE_URL 확인값이 일치하지 않습니다."
      )
    }
  }

  const input = {
    email,
    name: environment.ADMIN_SEED_NAME?.trim() || "관리자",
    now: new Date(),
    password,
    resetPassword: environment.ADMIN_SEED_RESET_PASSWORD === "true",
  }
  validateSeedAdminInput(input)
  return { databaseUrl, input }
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
  const client = createWritingAppDatabase(command.databaseUrl)
  try {
    runApplicationMigrations(client.sqlite)
    await seedAdminUser(client.db, command.input)
  } finally {
    client.close()
  }
}
