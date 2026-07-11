import { z } from "zod"
import { asc } from "drizzle-orm"

import { adminRoleSchema, type AdminRole } from "@workspace/core/admin"
import type { WritingAppDatabase } from "@workspace/db/client"
import { createReadOnlyWritingAppDatabase } from "@workspace/db/client"
import {
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthUsers,
} from "@workspace/db/schema"

const approvedAdminSchema = z.object({
  email: z.email(),
  role: adminRoleSchema,
})

export type ApprovedAdmin = z.infer<typeof approvedAdminSchema>

export type AdminAuthAuditEntry = {
  readonly accounts: readonly {
    readonly createdAt: string
    readonly providerId: string
  }[]
  readonly activeSessionCount: number
  readonly createdAt: string
  readonly email: string
  readonly expiredSessionCount: number
  readonly role: AdminRole
  readonly sessions: readonly {
    readonly createdAt: string
    readonly expiresAt: string
    readonly status: "active" | "expired"
  }[]
  readonly status: "approved" | "role_mismatch" | "unapproved"
}

export type AdminAuthAuditReport = {
  readonly differences: readonly string[]
  readonly generatedAt: string
  readonly inventory: readonly AdminAuthAuditEntry[]
  readonly missingApprovedAdmins: readonly ApprovedAdmin[]
}

export async function auditAdminAuth(
  db: WritingAppDatabase,
  approvedAdmins: readonly ApprovedAdmin[],
  now: Date
): Promise<AdminAuthAuditReport> {
  const users = await db
    .select({
      createdAt: adminAuthUsers.createdAt,
      email: adminAuthUsers.email,
      id: adminAuthUsers.id,
      role: adminAuthUsers.role,
    })
    .from(adminAuthUsers)
    .orderBy(asc(adminAuthUsers.email))
  const accounts = await db
    .select({
      createdAt: adminAuthAccounts.createdAt,
      providerId: adminAuthAccounts.providerId,
      userId: adminAuthAccounts.userId,
    })
    .from(adminAuthAccounts)
    .orderBy(asc(adminAuthAccounts.createdAt))
  const sessions = await db
    .select({
      createdAt: adminAuthSessions.createdAt,
      expiresAt: adminAuthSessions.expiresAt,
      userId: adminAuthSessions.userId,
    })
    .from(adminAuthSessions)
    .orderBy(asc(adminAuthSessions.createdAt))
  const approvedByEmail = new Map(
    approvedAdmins.map((admin) => [admin.email.toLowerCase(), admin])
  )

  const inventory = users.map((user): AdminAuthAuditEntry => {
    const approved = approvedByEmail.get(user.email.toLowerCase())
    const userSessions = sessions.filter(
      (session) => session.userId === user.id
    )
    const sessionInventory = userSessions.map((session) => ({
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      status:
        session.expiresAt.getTime() > now.getTime()
          ? ("active" as const)
          : ("expired" as const),
    }))

    return {
      accounts: accounts
        .filter((account) => account.userId === user.id)
        .map((account) => ({
          createdAt: account.createdAt.toISOString(),
          providerId: account.providerId,
        })),
      activeSessionCount: sessionInventory.filter(
        (session) => session.status === "active"
      ).length,
      createdAt: user.createdAt.toISOString(),
      email: user.email,
      expiredSessionCount: sessionInventory.filter(
        (session) => session.status === "expired"
      ).length,
      role: user.role,
      sessions: sessionInventory,
      status:
        approved === undefined
          ? "unapproved"
          : approved.role === user.role
            ? "approved"
            : "role_mismatch",
    }
  })
  const actualEmails = new Set(users.map((user) => user.email.toLowerCase()))
  const missingApprovedAdmins = approvedAdmins.filter(
    (admin) => !actualEmails.has(admin.email.toLowerCase())
  )
  const differences = [
    ...inventory
      .filter((entry) => entry.status !== "approved")
      .map((entry) => `${entry.email}: ${entry.status}`),
    ...missingApprovedAdmins.map((admin) => `${admin.email}: missing`),
  ]

  return {
    differences,
    generatedAt: now.toISOString(),
    inventory,
    missingApprovedAdmins,
  }
}

export function parseApprovedAdmins(
  value: string | undefined
): ApprovedAdmin[] {
  if (value === undefined) {
    throw new Error("ADMIN_AUDIT_APPROVED_ADMINS_JSON을 명시해야 합니다.")
  }

  const parsedJson: unknown = JSON.parse(value)
  return z.array(approvedAdminSchema).parse(parsedJson)
}

if (import.meta.main) {
  const databaseUrl = process.env["DATABASE_URL"]
  if (databaseUrl === undefined) {
    throw new Error("읽기 전용 감사에는 명시적인 DATABASE_URL이 필요합니다.")
  }

  const client = createReadOnlyWritingAppDatabase(databaseUrl)

  try {
    const report = await auditAdminAuth(
      client.db,
      parseApprovedAdmins(process.env["ADMIN_AUDIT_APPROVED_ADMINS_JSON"]),
      new Date()
    )
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  } finally {
    client.close()
  }
}
