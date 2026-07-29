import { eq } from "drizzle-orm"
import { err, ok } from "@workspace/kernel/result"
import { authSessions } from "@workspace/auth/schema"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { IdentitySessionRevocationPort } from "@workspace/identity/ports"

export function createIdentitySessionRevocation(
  database: WritingAppDatabase
): IdentitySessionRevocationPort {
  return {
    async revokeLearnerSessions(userId) {
      try {
        database
          .delete(authSessions)
          .where(eq(authSessions.userId, userId))
          .run()
        return ok(undefined)
      } catch (cause) {
        return err({ cause, kind: "session-revocation-failed" })
      }
    },
  }
}
