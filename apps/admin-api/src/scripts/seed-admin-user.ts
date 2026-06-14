export type SeedAdminUserInput = {
  readonly email: string
  readonly name: string
  readonly now: Date
}

export function createSeedAdminUserRow({
  email,
  name,
  now,
}: SeedAdminUserInput) {
  return {
    createdAt: now,
    email,
    emailVerified: true,
    id: "admin-1",
    image: null,
    name,
    role: "owner" as const,
    updatedAt: now,
  }
}
