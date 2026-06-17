import { adminRoles } from "@workspace/core/admin"

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
}: SeedAdminUserRowInput) {
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
