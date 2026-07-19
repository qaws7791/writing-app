import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { learnerAccountStatuses } from "@workspace/contracts/status"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"

import type {
  LearnerProfileRepository,
  SessionResolver,
} from "@workspace/core/auth"
import {
  createLearnerTestAuthPlugin,
  defaultLearnerTestAuthUser,
} from "@/adapters/auth/learner-test-auth-plugin"
import type { WritingAppDatabase } from "@workspace/db/client"
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
} from "@workspace/db/schema"
import * as dbSchema from "@workspace/db/schema"

export type CreateLearnerAuthInput = {
  readonly apiOrigin: string
  readonly cookieDomain?: string
  readonly db: WritingAppDatabase
  readonly googleClientId?: string
  readonly googleClientSecret?: string
  readonly profileRepository: LearnerProfileRepository
  readonly secret: string
  readonly testAuthEnabled?: boolean
  readonly webOrigin: string
}

export function createLearnerAuth(input: CreateLearnerAuthInput) {
  return betterAuth({
    advanced: createLearnerAdvancedOptions(input.cookieDomain),
    basePath: "/api/auth",
    baseURL: input.apiOrigin,
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
    databaseHooks: createLearnerAuthHooks({
      profileRepository: input.profileRepository,
    }),
    plugins:
      input.testAuthEnabled === true
        ? [
            createLearnerTestAuthPlugin({
              callbackOrigin: input.webOrigin,
              database: input.db,
              user: defaultLearnerTestAuthUser,
            }),
          ]
        : [],
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
  profileRepository: LearnerProfileRepository
): SessionResolver {
  return {
    async resolveSession(headers) {
      const session = await auth.api.getSession({ headers })

      if (session === null) {
        return null
      }

      return readUserSession(profileRepository, session.user)
    },
  }
}

function createLearnerAuthHooks({
  profileRepository,
}: {
  readonly profileRepository: LearnerProfileRepository
}) {
  return {
    user: {
      create: {
        after: async (user: { readonly id: string; readonly name: string }) => {
          await profileRepository.ensureActiveProfile({
            displayName: user.name,
            userId: user.id,
          })
        },
      },
    },
  }
}

function createLearnerAdvancedOptions(cookieDomain: string | undefined) {
  const baseOptions = {
    cookies: {
      session_token: {
        name: learnerSessionCookieName,
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

async function readUserSession(
  profileRepository: LearnerProfileRepository,
  user: SessionUserRow
) {
  const profile = await profileRepository.findProfileByUserId(user.id)

  if (profile === null) {
    await profileRepository.ensureActiveProfile({
      displayName: user.name,
      userId: user.id,
    })
  }

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
