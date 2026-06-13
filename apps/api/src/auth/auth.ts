import { eq } from "drizzle-orm"

import type { SessionResolver } from "@/auth/session"
import type { KwepDatabase } from "@workspace/db"
import { authUsers, learnerProfiles } from "@workspace/db"

export function createBearerSessionResolver(db: KwepDatabase): SessionResolver {
  return {
    async resolveSession(token) {
      const user = db
        .select()
        .from(authUsers)
        .where(eq(authUsers.id, token))
        .get()

      if (user === undefined) {
        return null
      }

      const profile = db
        .select()
        .from(learnerProfiles)
        .where(eq(learnerProfiles.userId, user.id))
        .get()

      return {
        user: {
          email: user.email,
          id: user.id,
          image: user.image,
          joinedAt: user.createdAt.toISOString(),
          name: user.name,
          status: profile?.status ?? "active",
        },
      }
    },
  }
}
