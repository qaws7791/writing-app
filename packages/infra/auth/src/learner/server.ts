import { betterAuth } from "better-auth"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import { learnerAccountStatuses } from "@workspace/contracts/identity/status"
import type {
  LearnerProfileRepository,
  SessionResolver,
} from "@workspace/core/auth"

import type { AuthDatabaseAdapter } from "#auth/shared/auth-database-adapter"
import { readAuthDatabaseAdapter } from "#auth/shared/auth-database-adapter"
import { createLearnerTestAuthPlugin } from "#auth/learner/test-auth-plugin"
import type { LearnerTestAuthConfiguration } from "#auth/learner/test-auth-types"

export type {
  LearnerTestAuthConfiguration,
  LearnerTestAuthDisplayNameSynchronizer,
} from "#auth/learner/test-auth-types"

export type CreateLearnerAuthRuntimeInput = {
  readonly apiOrigin: string
  readonly cookieDomain?: string
  readonly database: AuthDatabaseAdapter
  readonly googleClientId?: string
  readonly googleClientSecret?: string
  readonly profileRepository: LearnerProfileRepository
  readonly secret: string
  readonly testAuth: LearnerTestAuthConfiguration
  readonly webOrigin: string
}

export type LearnerAuthRuntime = {
  readonly authHandler: (request: Request) => Promise<Response>
  readonly sessionResolver: SessionResolver
}

export function createLearnerAuthRuntime(
  input: CreateLearnerAuthRuntimeInput
): LearnerAuthRuntime {
  const auth = betterAuth({
    advanced: createLearnerAdvancedOptions(input.cookieDomain),
    basePath: "/api/auth",
    baseURL: input.apiOrigin,
    database: readAuthDatabaseAdapter(input.database),
    databaseHooks: createLearnerAuthHooks({
      profileRepository: input.profileRepository,
    }),
    plugins:
      input.testAuth.kind === "enabled"
        ? [
            createLearnerTestAuthPlugin({
              callbackOrigin: input.webOrigin,
              displayNameSynchronizer: input.testAuth,
            }),
          ]
        : [],
    rateLimit: { storage: "database" },
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

  return {
    authHandler: auth.handler,
    sessionResolver: createLearnerSessionResolver(
      auth,
      input.profileRepository
    ),
  }
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

function createLearnerSessionResolver(
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
