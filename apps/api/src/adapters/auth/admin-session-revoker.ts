import { eq } from "drizzle-orm"
import type { AdminSessionRevoker } from "@workspace/auth/admin/server"
import type { WritingAppDatabase } from "@workspace/db"
import { adminAuthSessions } from "@workspace/db/schema"

export function createDrizzleAdminSessionRevoker(
  database: WritingAppDatabase
): AdminSessionRevoker {
  return {
    revokeAllForAdmin(adminId) {
      database
        .delete(adminAuthSessions)
        .where(eq(adminAuthSessions.userId, adminId))
        .run()
    },
  }
}
