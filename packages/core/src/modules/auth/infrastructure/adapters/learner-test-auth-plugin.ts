import type { BetterAuthPlugin } from "better-auth"
import { createAuthEndpoint } from "better-auth/api"
import { setSessionCookie } from "better-auth/cookies"
import { z } from "zod"

const googleProviderId = "google"

export type LearnerTestAuthUser = {
  readonly accountId: string
  readonly email: string
  readonly id: string
  readonly image: null | string
  readonly name: string
}

export type LearnerTestAuthConfig = {
  readonly callbackOrigin: string
  readonly user: LearnerTestAuthUser
}

export const defaultLearnerTestAuthUser: LearnerTestAuthUser = {
  accountId: "test-google-user-1",
  email: "learner@example.com",
  id: "user-1",
  image: null,
  name: "학습자",
}

export function createLearnerTestAuthPlugin(
  config: LearnerTestAuthConfig
): BetterAuthPlugin {
  return {
    id: "learner-test-auth",
    endpoints: {
      learnerTestSignIn: createAuthEndpoint(
        "/test/sign-in",
        {
          method: "GET",
          query: z.object({
            callbackURL: z.string().optional(),
          }),
        },
        async (ctx) => {
          const adapter = ctx.context.internalAdapter as LearnerInternalAdapter
          const user = await findOrCreateTestUser(adapter, config.user)
          const session = await adapter.createSession(user.id)

          await setSessionCookie(ctx, {
            session,
            user,
          })

          throw ctx.redirect(
            resolveCallbackUrl(ctx.query.callbackURL, config.callbackOrigin)
          )
        }
      ),
    },
  }
}

type BetterAuthUser = {
  readonly createdAt: Date
  readonly email: string
  readonly emailVerified: boolean
  readonly id: string
  readonly image?: null | string
  readonly name: string
  readonly updatedAt: Date
}

type BetterAuthAccount = {
  readonly providerId: string
}

type LearnerInternalAdapter = {
  readonly createSession: (userId: string) => Promise<{
    readonly createdAt: Date
    readonly expiresAt: Date
    readonly id: string
    readonly token: string
    readonly updatedAt: Date
    readonly userId: string
  }>
  readonly createUser: (user: {
    readonly email: string
    readonly emailVerified: boolean
    readonly id: string
    readonly image: null | string
    readonly name: string
  }) => Promise<BetterAuthUser>
  readonly findUserByEmail: (
    email: string,
    options: { readonly includeAccounts: true }
  ) => Promise<{
    readonly accounts: readonly BetterAuthAccount[]
    readonly user: BetterAuthUser
  } | null>
  readonly linkAccount: (account: {
    readonly accountId: string
    readonly providerId: string
    readonly userId: string
  }) => Promise<unknown>
}

async function findOrCreateTestUser(
  adapter: LearnerInternalAdapter,
  user: LearnerTestAuthUser
) {
  const existingUser = await adapter.findUserByEmail(user.email, {
    includeAccounts: true,
  })

  if (existingUser !== null) {
    await ensureGoogleAccount(adapter, {
      accountId: user.accountId,
      accounts: existingUser.accounts,
      userId: existingUser.user.id,
    })

    return existingUser.user
  }

  const createdUser = await adapter.createUser({
    email: user.email,
    emailVerified: true,
    id: user.id,
    image: user.image,
    name: user.name,
  })

  await ensureGoogleAccount(adapter, {
    accountId: user.accountId,
    accounts: [],
    userId: createdUser.id,
  })

  return createdUser
}

async function ensureGoogleAccount(
  adapter: LearnerInternalAdapter,
  input: {
    readonly accountId: string
    readonly accounts: readonly { readonly providerId: string }[]
    readonly userId: string
  }
): Promise<void> {
  const hasGoogleAccount = input.accounts.some(
    (account) => account.providerId === googleProviderId
  )

  if (hasGoogleAccount) {
    return
  }

  await adapter.linkAccount({
    accountId: input.accountId,
    providerId: googleProviderId,
    userId: input.userId,
  })
}

function resolveCallbackUrl(
  rawCallbackUrl: string | undefined,
  callbackOrigin: string
): string {
  const fallbackUrl = new URL("/app", callbackOrigin)

  if (rawCallbackUrl === undefined || rawCallbackUrl.length === 0) {
    return fallbackUrl.toString()
  }

  const callbackUrl = new URL(rawCallbackUrl, callbackOrigin)

  return callbackUrl.origin === fallbackUrl.origin
    ? callbackUrl.toString()
    : fallbackUrl.toString()
}
