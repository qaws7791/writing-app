import { eq } from "drizzle-orm"
import type { AdminSessionRevoker } from "@workspace/auth/admin/server"
import { adminAuthSessions } from "@workspace/auth/schema"
import type { WritingAppDatabase } from "@workspace/db/client"

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
