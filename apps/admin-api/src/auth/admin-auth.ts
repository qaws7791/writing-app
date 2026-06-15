import { and, eq, gt } from "drizzle-orm"

import type { AdminSessionResolver } from "@/auth/admin-session"
import type { KwepDatabase } from "@workspace/db/client"
import { adminAuthSessions, adminAuthUsers } from "@workspace/db/schema"

export function createAdminBearerSessionResolver(
  db: KwepDatabase,
  now: () => Date = () => new Date()
): AdminSessionResolver {
  return {
    async resolveSession(token) {
      const session = db
        .select({
          email: adminAuthUsers.email,
          id: adminAuthUsers.id,
          name: adminAuthUsers.name,
          role: adminAuthUsers.role,
        })
        .from(adminAuthSessions)
        .innerJoin(
          adminAuthUsers,
          eq(adminAuthUsers.id, adminAuthSessions.userId)
        )
        .where(
          and(
            eq(adminAuthSessions.token, token),
            gt(adminAuthSessions.expiresAt, now())
          )
        )
        .get()

      if (session !== undefined) {
        return {
          admin: session,
        }
      }

      return null
    },
  }
}
