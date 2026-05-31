import { hashPassword } from "better-auth/crypto"

interface CreateAdminUserWithCredentialInput {
  accountId: string
  createdAt: Date
  email: string
  name: string
  passwordHash: string
  updatedAt: Date
  userId: string
}

interface UpdateCredentialPasswordInput {
  passwordHash: string
  updatedAt: Date
  userId: string
}

export interface AdminSeedDatabase {
  createAdminUserWithCredential(
    input: CreateAdminUserWithCredentialInput
  ): Promise<void>
  findAdminUserByEmail(email: string): Promise<{ id: string } | undefined>
  updateCredentialPassword(input: UpdateCredentialPasswordInput): Promise<void>
}

export type SeedAdminUserResult =
  | {
      status: "created"
    }
  | {
      status: "already-exists"
    }
  | {
      status: "password-updated"
    }

interface SeedAdminUserInput {
  email: string
  name: string
  password: string
  resetExistingPassword?: boolean
}

export async function seedAdminUser(
  db: AdminSeedDatabase,
  input: SeedAdminUserInput
): Promise<SeedAdminUserResult> {
  const normalizedEmail = input.email.toLowerCase()
  const existingUser = await db.findAdminUserByEmail(normalizedEmail)

  if (existingUser && !input.resetExistingPassword) {
    return { status: "already-exists" }
  }

  const now = new Date()
  const passwordHash = await hashPassword(input.password)

  if (existingUser) {
    await db.updateCredentialPassword({
      passwordHash,
      updatedAt: now,
      userId: existingUser.id,
    })

    return { status: "password-updated" }
  }

  const userId = crypto.randomUUID()

  await db.createAdminUserWithCredential({
    accountId: crypto.randomUUID(),
    createdAt: now,
    email: normalizedEmail,
    name: input.name,
    passwordHash,
    updatedAt: now,
    userId,
  })

  return { status: "created" }
}
