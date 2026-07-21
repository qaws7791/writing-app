import type { BetterAuthPlugin } from "better-auth"
import { createAuthEndpoint } from "better-auth/api"
import { setSessionCookie } from "better-auth/cookies"
import { z } from "zod"

import type { LearnerTestAuthDisplayNameSynchronizer } from "#auth/learner/test-auth-types"

const googleProviderId = "google"

type LearnerTestAuthUser = {
  readonly accountId: string
  readonly email: string
  readonly id: string
  readonly image: string | null
  readonly name: string
}

const defaultLearnerTestAuthUser: LearnerTestAuthUser = {
  accountId: "test-google-user-1",
  email: "learner@example.com",
  id: "user-1",
  image: null,
  name: "글쓰기 탐험가",
}

export function createLearnerTestAuthPlugin(input: {
  readonly callbackOrigin: string
  readonly displayNameSynchronizer: LearnerTestAuthDisplayNameSynchronizer
}): BetterAuthPlugin {
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
        async (context) => {
          const adapter = context.context
            .internalAdapter as LearnerInternalAdapter
          const user = await findOrCreateTestUser(
            adapter,
            defaultLearnerTestAuthUser,
            input.displayNameSynchronizer
          )
          const session = await adapter.createSession(user.id)

          await setSessionCookie(context, {
            session,
            user,
          })

          throw context.redirect(
            resolveCallbackUrl(context.query.callbackURL, input.callbackOrigin)
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
  user: LearnerTestAuthUser,
  displayNameSynchronizer: LearnerTestAuthDisplayNameSynchronizer
): Promise<BetterAuthUser> {
  const existingUser = await adapter.findUserByEmail(user.email, {
    includeAccounts: true,
  })

  if (existingUser !== null) {
    await ensureGoogleAccount(adapter, {
      accountId: user.accountId,
      accounts: existingUser.accounts,
      userId: existingUser.user.id,
    })

    return synchronizeExistingTestUser(
      existingUser.user,
      user,
      displayNameSynchronizer
    )
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

async function synchronizeExistingTestUser(
  existingUser: BetterAuthUser,
  expectedUser: LearnerTestAuthUser,
  displayNameSynchronizer: LearnerTestAuthDisplayNameSynchronizer
): Promise<BetterAuthUser> {
  if (existingUser.name === expectedUser.name) {
    return existingUser
  }

  const updatedAt = new Date()

  await displayNameSynchronizer.synchronizeDisplayName({
    displayName: expectedUser.name,
    updatedAt,
    userId: existingUser.id,
  })

  return {
    ...existingUser,
    name: expectedUser.name,
    updatedAt,
  }
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
