import { eq } from "drizzle-orm"
import { err, ok } from "@workspace/kernel/result"
import { adminAuthSessions, authSessions } from "@workspace/auth/schema"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { IdentitySessionRevocationPort } from "@workspace/identity/ports"

export function createIdentitySessionRevocation(
  database: WritingAppDatabase
): IdentitySessionRevocationPort {
  return {
    async revokeAdminSessions(adminId) {
      try {
        database
          .delete(adminAuthSessions)
          .where(eq(adminAuthSessions.userId, adminId))
          .run()
        return ok(undefined)
      } catch {
        return err({ kind: "session-revocation-failed" })
      }
    },
    async revokeLearnerSessions(userId) {
      try {
        database
          .delete(authSessions)
          .where(eq(authSessions.userId, userId))
          .run()
        return ok(undefined)
      } catch {
        return err({ kind: "session-revocation-failed" })
      }
    },
  }
}
