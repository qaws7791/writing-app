import { betterAuth } from "better-auth"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"

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
  readonly identityProvisioner: LearnerIdentityProvisioner
  readonly secret: string
  readonly testAuth: LearnerTestAuthConfiguration
  readonly webOrigin: string
}

export type LearnerAuthRuntime = {
  readonly authHandler: (request: Request) => Promise<Response>
  readonly identityResolver: LearnerAuthIdentityResolver
}

export type LearnerAuthIdentity = Readonly<{
  email: string
  id: string
  image: string | null
  joinedAt: Date
  name: string
}>

export type LearnerAuthIdentityResolver = Readonly<{
  resolveIdentity: (headers: Headers) => Promise<LearnerAuthIdentity | null>
}>

export type LearnerIdentityProvisioner = Readonly<{
  provision: (identity: LearnerAuthIdentity) => Promise<void>
}>

export function createLearnerAuthRuntime(
  input: CreateLearnerAuthRuntimeInput
): LearnerAuthRuntime {
  const auth = betterAuth({
    advanced: createLearnerAdvancedOptions(input.cookieDomain),
    basePath: "/api/auth",
    baseURL: input.apiOrigin,
    database: readAuthDatabaseAdapter(input.database),
    databaseHooks: createLearnerAuthHooks({
      identityProvisioner: input.identityProvisioner,
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
    identityResolver: createLearnerIdentityResolver(auth),
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

function createLearnerIdentityResolver(
  auth: LearnerBetterAuthSessionApi
): LearnerAuthIdentityResolver {
  return {
    async resolveIdentity(headers) {
      const session = await auth.api.getSession({ headers })
      return session === null ? null : toLearnerAuthIdentity(session.user)
    },
  }
}

function createLearnerAuthHooks({
  identityProvisioner,
}: {
  readonly identityProvisioner: LearnerIdentityProvisioner
}) {
  return {
    user: {
      create: {
        after: async (user: SessionUserRow) => {
          await identityProvisioner.provision(toLearnerAuthIdentity(user))
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

function toLearnerAuthIdentity(user: SessionUserRow): LearnerAuthIdentity {
  return {
    email: user.email,
    id: user.id,
    image: user.image ?? null,
    joinedAt: new Date(user.createdAt),
    name: user.name,
  }
}
