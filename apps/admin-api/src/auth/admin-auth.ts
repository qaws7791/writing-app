import { and, eq, gt } from "drizzle-orm"

import type { AdminSessionResolver } from "@/auth/admin-session"
import type { KwepDatabase } from "@workspace/db"
import { adminAuthSessions, adminAuthUsers } from "@workspace/db"

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

      const user = db
        .select({
          email: adminAuthUsers.email,
          id: adminAuthUsers.id,
          name: adminAuthUsers.name,
          role: adminAuthUsers.role,
        })
        .from(adminAuthUsers)
        .where(eq(adminAuthUsers.id, token))
        .get()

      return user === undefined
        ? null
        : {
            admin: user,
          }
    },
  }
}
