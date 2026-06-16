import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import { learnerAccountStatuses } from "@workspace/core/status"

import type { SessionResolver } from "@/auth/session"
import type { KwepDatabase } from "@workspace/db/client"
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
  learnerProfiles,
} from "@workspace/db/schema"
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
      schema: {
        ...dbSchema,
        account: authAccounts,
        session: authSessions,
        user: authUsers,
        verification: authVerifications,
      },
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

type LearnerBetterAuthSessionApi = {
  readonly api: {
    readonly getSession: (input: {
      readonly headers: Headers
    }) => Promise<LearnerBetterAuthSession | null>
  }
}

type LearnerBetterAuthSession = {
  readonly user: {
    readonly createdAt: Date | string
    readonly email: string
    readonly id: string
    readonly image?: string | null
    readonly name: string
  }
}

export function createLearnerSessionResolver(
  auth: LearnerBetterAuthSessionApi,
  db: KwepDatabase
): SessionResolver {
  return {
    async resolveSession(headers) {
      const session = await auth.api.getSession({ headers })

      if (session === null) {
        return null
      }

      return readUserSession(db, session.user)
    },
  }
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
  readonly createdAt: Date | string
  readonly email: string
  readonly id: string
  readonly image?: string | null
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
      image: user.image ?? null,
      joinedAt: new Date(user.createdAt).toISOString(),
      name: user.name,
      status: profile?.status ?? learnerAccountStatuses.active,
    },
  }
}
