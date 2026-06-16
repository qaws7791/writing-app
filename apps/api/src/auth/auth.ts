import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { and, eq, gt } from "drizzle-orm"
import { learnerAccountStatuses } from "@workspace/core/status"

import type { SessionResolver } from "@/auth/session"
import type { KwepDatabase } from "@workspace/db/client"
import { authSessions, authUsers, learnerProfiles } from "@workspace/db/schema"
import * as dbSchema from "@workspace/db/schema"

export type CreateLearnerAuthInput = {
  readonly authBaseUrl: string
  readonly cookieDomain?: string
  readonly db: KwepDatabase
  readonly googleClientId?: string
  readonly googleClientSecret?: string
  readonly secret: string
  readonly webOrigin: string
}

export function createLearnerAuth(input: CreateLearnerAuthInput) {
  return betterAuth({
    advanced: createLearnerAdvancedOptions(input.cookieDomain),
    baseURL: input.authBaseUrl,
    database: drizzleAdapter(input.db, {
      provider: "sqlite",
      schema: dbSchema,
    }),
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await Promise.resolve(
              input.db
                .insert(learnerProfiles)
                .values({
                  deletedAt: null,
                  displayName: user.name,
                  status: learnerAccountStatuses.active,
                  userId: user.id,
                })
                .onConflictDoNothing()
                .run()
            )
          },
        },
      },
    },
    secret: input.secret,
    socialProviders:
      input.googleClientId === undefined ||
      input.googleClientSecret === undefined
        ? {}
        : {
            google: {
              clientId: input.googleClientId,
              clientSecret: input.googleClientSecret,
              mapProfileToUser: (profile) => ({
                emailVerified: profile.email_verified,
                image: profile.picture,
                name: profile.name,
              }),
              scope: ["openid", "email", "profile"],
            },
          },
    trustedOrigins: [input.webOrigin],
  })
}

export function createBearerSessionResolver(
  db: KwepDatabase,
  now: () => Date = () => new Date()
): SessionResolver {
  return {
    async resolveSession(token) {
      const sessionToken = readBetterAuthSessionToken(token)
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
          and(
            eq(authSessions.token, sessionToken),
            gt(authSessions.expiresAt, now())
          )
        )
        .get()

      if (sessionUser !== undefined) {
        return readUserSession(db, sessionUser)
      }

      return null
    },
  }
}

export function readBetterAuthSessionToken(token: string): string {
  return token.split(".")[0] ?? token
}

function createLearnerAdvancedOptions(cookieDomain: string | undefined) {
  const baseOptions = {
    cookies: {
      session_token: {
        name: "kwep_session",
      },
    },
  }

  if (cookieDomain === undefined) {
    return baseOptions
  }

  return {
    ...baseOptions,
    crossSubDomainCookies: {
      domain: cookieDomain,
      enabled: true,
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
      status: profile?.status ?? learnerAccountStatuses.active,
    },
  }
}
