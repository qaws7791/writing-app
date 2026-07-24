import {
  createLearnerAuthClient,
  type LearnerAuthClient,
} from "@workspace/auth/learner/client"

import {
  createVerifiedLoginPagePath,
  resolveSafeNextPath,
} from "@/features/authentication/model/auth-navigation"

export async function requestEmailLogin(input: {
  readonly email: string
  readonly nextPath: string
  readonly password: string
}): Promise<void> {
  await getDefaultWebAuthClient().requestEmailLogin(input)
}

export async function requestEmailSignUp(input: {
  readonly email: string
  readonly name: string
  readonly nextPath: string
  readonly password: string
}): Promise<void> {
  await getDefaultWebAuthClient().requestEmailSignUp(input)
}

export async function requestVerificationEmail(input: {
  readonly email: string
  readonly nextPath: string
}): Promise<void> {
  await getDefaultWebAuthClient().requestVerificationEmail(input)
}

export async function requestGoogleLogin(nextPath: string): Promise<void> {
  await getDefaultWebAuthClient().requestGoogleLogin(nextPath)
}

export async function requestPasswordReset(email: string): Promise<void> {
  await getDefaultWebAuthClient().requestPasswordReset(email)
}

export async function resetPassword(input: {
  readonly newPassword: string
  readonly token: string
}): Promise<void> {
  await getDefaultWebAuthClient().resetPassword(input)
}

export async function requestLogout(callbackPath: string): Promise<string> {
  return getDefaultWebAuthClient().requestLogout(callbackPath)
}

export type WebAuthClient = {
  readonly requestEmailLogin: (input: {
    readonly email: string
    readonly nextPath: string
    readonly password: string
  }) => Promise<void>
  readonly requestEmailSignUp: (input: {
    readonly email: string
    readonly name: string
    readonly nextPath: string
    readonly password: string
  }) => Promise<void>
  readonly requestGoogleLogin: (nextPath: string) => Promise<void>
  readonly requestLogout: (callbackPath: string) => Promise<string>
  readonly requestPasswordReset: (email: string) => Promise<void>
  readonly resetPassword: (input: {
    readonly newPassword: string
    readonly token: string
  }) => Promise<void>
  readonly requestVerificationEmail: (input: {
    readonly email: string
    readonly nextPath: string
  }) => Promise<void>
}

type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export function createWebAuthClient({
  fetchImplementation = globalThis.fetch.bind(globalThis),
  learnerAuthClientFactory = createLearnerAuthClient,
}: {
  readonly fetchImplementation?: FetchImplementation
  readonly learnerAuthClientFactory?: (input: {
    readonly fetch: FetchImplementation
  }) => LearnerAuthClient
} = {}): WebAuthClient {
  const authClient = learnerAuthClientFactory({
    fetch: fetchImplementation,
  })

  return {
    async requestEmailLogin(credentials) {
      await authClient.signInWithEmail({
        callbackURL: createCallbackUrl(credentials.nextPath),
        email: credentials.email,
        password: credentials.password,
      })
    },
    async requestEmailSignUp(credentials) {
      await authClient.signUpWithEmail({
        callbackURL: createVerificationCallbackUrl(credentials.nextPath),
        email: credentials.email,
        name: credentials.name,
        password: credentials.password,
      })
    },
    async requestGoogleLogin(nextPath) {
      await authClient.signInWithGoogle({
        callbackURL: createCallbackUrl(nextPath),
        errorCallbackURL: createAbsoluteUrl("/login?authError=true"),
      })
    },
    async requestPasswordReset(email) {
      await authClient.requestPasswordReset({
        email,
        redirectTo: createAbsoluteUrl("/reset-password"),
      })
    },
    async resetPassword(resetInput) {
      await authClient.resetPassword(resetInput)
    },
    async requestVerificationEmail(verificationInput) {
      await authClient.resendVerificationEmail({
        callbackURL: createVerificationCallbackUrl(verificationInput.nextPath),
        email: verificationInput.email,
      })
    },
    async requestLogout(callbackPath) {
      const safeCallbackPath = resolveSafeNextPath(callbackPath)
      await authClient.signOut()

      return safeCallbackPath
    },
  }
}

function createVerificationCallbackUrl(nextPath: string): string {
  return createAbsoluteUrl(createVerifiedLoginPagePath(nextPath))
}

function createCallbackUrl(nextPath: string): string {
  return createAbsoluteUrl(resolveSafeNextPath(nextPath))
}

function createAbsoluteUrl(path: string): string {
  const browserOrigin =
    typeof window === "undefined" ? "" : window.location.origin

  return new URL(path, browserOrigin).toString()
}

function getDefaultWebAuthClient(): WebAuthClient {
  return createWebAuthClient()
}
