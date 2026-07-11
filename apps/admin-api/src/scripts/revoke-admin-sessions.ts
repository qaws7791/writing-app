import { createWritingAppDatabase } from "@workspace/db/client"
import type { WritingAppDatabase } from "@workspace/db/client"
import { adminAuthSessions } from "@workspace/db/schema"

export function revokeAllAdminSessions(db: WritingAppDatabase): number {
  return db.transaction((transaction) => {
    const sessionCount = transaction
      .select({ id: adminAuthSessions.id })
      .from(adminAuthSessions)
      .all().length

    transaction.delete(adminAuthSessions).run()

    return sessionCount
  })
}

export function requireAdminSessionRevocationApproval(
  databaseUrl: string | undefined,
  expectedDatabaseUrl: string | undefined,
  approved: string | undefined
): string {
  if (databaseUrl === undefined) {
    throw new Error("세션 폐기에는 명시적인 DATABASE_URL이 필요합니다.")
  }
  if (approved !== "true") {
    throw new Error(
      "세션 폐기에는 ADMIN_SESSION_REVOCATION_APPROVED=true가 필요합니다."
    )
  }
  if (expectedDatabaseUrl !== databaseUrl) {
    throw new Error("세션 폐기 대상 DATABASE_URL 확인값이 일치하지 않습니다.")
  }

  return databaseUrl
}

if (import.meta.main) {
  const databaseUrl = requireAdminSessionRevocationApproval(
    process.env["DATABASE_URL"],
    process.env["ADMIN_SESSION_EXPECTED_DATABASE_URL"],
    process.env["ADMIN_SESSION_REVOCATION_APPROVED"]
  )
  const client = createWritingAppDatabase(databaseUrl)

  try {
    const revokedSessionCount = revokeAllAdminSessions(client.db)
    process.stdout.write(`${JSON.stringify({ revokedSessionCount })}\n`)
  } finally {
    client.close()
  }
}
