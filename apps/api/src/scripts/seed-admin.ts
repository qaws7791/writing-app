import { hashAuthPassword } from "@workspace/auth/password"
import {
  adminAuthAccounts,
  adminAuthUsers,
  type WritingAppDatabase,
} from "@workspace/db"
import {
  createWritingAppDatabase,
  getDefaultDatabaseUrl,
} from "@workspace/db/client"

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

      transaction
        .insert(adminAuthUsers)
        .values(rows.user)
        .onConflictDoUpdate({
          set: {
            email: rows.user.email,
            emailVerified: rows.user.emailVerified,
            image: rows.user.image,
            name: rows.user.name,
            role: rows.user.role,
            updatedAt: rows.user.updatedAt,
          },
          target: adminAuthUsers.id,
        })
        .run()

      if (input.resetPassword !== true) {
        transaction
          .insert(adminAuthAccounts)
          .values(rows.account)
          .onConflictDoNothing({ target: adminAuthAccounts.id })
          .run()
        return
      }

      transaction
        .insert(adminAuthAccounts)
        .values(rows.account)
        .onConflictDoUpdate({
          set: {
            password: rows.account.password,
            updatedAt: rows.account.updatedAt,
          },
          target: adminAuthAccounts.id,
        })
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
    await seedAdminUser(client.db, command.input)
  } finally {
    client.close()
  }
}
