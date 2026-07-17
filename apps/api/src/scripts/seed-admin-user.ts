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

export type SeedAdminUserInput = SeedAdminUserRowInput & {
  readonly password: string
  readonly resetPassword?: boolean
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

export function createSeedAdminAccountRow(input: {
  readonly passwordHash: string
  readonly userRow: SeedAdminUserRow
}): SeedAdminAccountRow {
  return {
    accessToken: null,
    accessTokenExpiresAt: null,
    accountId: input.userRow.id,
    createdAt: input.userRow.createdAt,
    id: `${input.userRow.id}-credential`,
    idToken: null,
    password: input.passwordHash,
    providerId: "credential",
    refreshToken: null,
    refreshTokenExpiresAt: null,
    scope: null,
    updatedAt: input.userRow.updatedAt,
    userId: input.userRow.id,
  }
}

export function createSeedAdminRows(
  input: SeedAdminUserRowInput & {
    readonly passwordHash: string
  }
): {
  readonly account: SeedAdminAccountRow
  readonly user: SeedAdminUserRow
} {
  const user = createSeedAdminUserRow(input)

  return {
    account: createSeedAdminAccountRow({
      passwordHash: input.passwordHash,
      userRow: user,
    }),
    user,
  }
}
