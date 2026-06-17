import { adminRoles } from "@workspace/core/admin"
import type { adminAuthAccounts, adminAuthUsers } from "@workspace/db"

export type SeedAdminUserRow = typeof adminAuthUsers.$inferInsert & {
  readonly emailVerified: true
  readonly id: "admin-1"
  readonly image: null
  readonly role: typeof adminRoles.owner
}

export type SeedAdminAccountRow = typeof adminAuthAccounts.$inferInsert & {
  readonly accountId: SeedAdminUserRow["id"]
  readonly id: `${SeedAdminUserRow["id"]}-credential`
  readonly providerId: "credential"
  readonly userId: SeedAdminUserRow["id"]
}

export type SeedAdminUserRowInput = {
  readonly email: string
  readonly name: string
  readonly now: Date
}

export type SeedAdminAccountRowInput = {
  readonly passwordHash: string
  readonly userRow: SeedAdminUserRow
}

export type SeedAdminRowsInput = SeedAdminUserRowInput & {
  readonly passwordHash: string
}

export type SeedAdminUserInput = SeedAdminUserRowInput & {
  readonly password: string
  readonly resetPassword?: boolean
}

export type SeedAdminRows = {
  readonly account: SeedAdminAccountRow
  readonly user: SeedAdminUserRow
}

export function createSeedAdminUserRow({
  email,
  name,
  now,
}: SeedAdminUserRowInput): SeedAdminUserRow {
  return {
    createdAt: now,
    email,
    emailVerified: true,
    id: "admin-1",
    image: null,
    name,
    role: adminRoles.owner,
    updatedAt: now,
  }
}

export function createSeedAdminAccountRow({
  passwordHash,
  userRow,
}: SeedAdminAccountRowInput): SeedAdminAccountRow {
  return {
    accessToken: null,
    accessTokenExpiresAt: null,
    accountId: userRow.id,
    createdAt: userRow.createdAt,
    id: `${userRow.id}-credential`,
    idToken: null,
    password: passwordHash,
    providerId: "credential",
    refreshToken: null,
    refreshTokenExpiresAt: null,
    scope: null,
    updatedAt: userRow.updatedAt,
    userId: userRow.id,
  }
}

export function createSeedAdminRows(input: SeedAdminRowsInput): SeedAdminRows {
  const user = createSeedAdminUserRow(input)

  return {
    account: createSeedAdminAccountRow({
      passwordHash: input.passwordHash,
      userRow: user,
    }),
    user,
  }
}
