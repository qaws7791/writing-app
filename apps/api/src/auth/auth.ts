import { and, eq, gt } from "drizzle-orm"

import type { SessionResolver } from "@/auth/session"
import type { KwepDatabase } from "@workspace/db"
import { authSessions, authUsers, learnerProfiles } from "@workspace/db"

export function createBearerSessionResolver(
  db: KwepDatabase,
  now: () => Date = () => new Date()
): SessionResolver {
  return {
    async resolveSession(token) {
      const sessionUser = db
        .select({
          createdAt: authUsers.createdAt,
          email: authUsers.email,
          id: authUsers.id,
          image: authUsers.image,
          name: authUsers.name,
        })
        .from(authSessions)
        .innerJoin(authUsers, eq(authUsers.id, authSessions.userId))
        .where(
          and(eq(authSessions.token, token), gt(authSessions.expiresAt, now()))
        )
        .get()

      if (sessionUser !== undefined) {
        return readUserSession(db, sessionUser)
      }

      const user = db
        .select({
          createdAt: authUsers.createdAt,
          email: authUsers.email,
          id: authUsers.id,
          image: authUsers.image,
          name: authUsers.name,
        })
        .from(authUsers)
        .where(eq(authUsers.id, token))
        .get()

      if (user === undefined) {
        return null
      }

      return readUserSession(db, user)
    },
  }
}

type SessionUserRow = {
  readonly createdAt: Date
  readonly email: string
  readonly id: string
  readonly image: string | null
  readonly name: string
}

function readUserSession(db: KwepDatabase, user: SessionUserRow) {
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
}
