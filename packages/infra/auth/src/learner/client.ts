import { createAuthClient } from "better-auth/client"

import type { FetchImplementation } from "#auth/shared/client"

export type LearnerAuthClient = {
  readonly requestPasswordReset: (input: {
    readonly email: string
    readonly redirectTo: string
  }) => Promise<void>
  readonly resendVerificationEmail: (input: {
    readonly callbackURL: string
    readonly email: string
  }) => Promise<void>
  readonly signInWithEmail: (input: {
    readonly callbackURL: string
    readonly email: string
    readonly password: string
  }) => Promise<void>
  readonly resetPassword: (input: {
    readonly newPassword: string
    readonly token: string
  }) => Promise<void>
  readonly signInWithGoogle: (input: {
    readonly callbackURL: string
    readonly errorCallbackURL: string
  }) => Promise<void>
  readonly signUpWithEmail: (input: {
    readonly callbackURL: string
    readonly email: string
    readonly name: string
    readonly password: string
  }) => Promise<void>
  readonly signOut: () => Promise<void>
}

export type LearnerAuthClientErrorCode =
  | "duplicate-email"
  | "email-delivery-failed"
  | "email-not-verified"
  | "invalid-credentials"
  | "invalid-email"
  | "invalid-reset-token"
  | "rate-limited"
  | "unknown"
  | "weak-password"

export class LearnerAuthClientError extends Error {
  readonly code: LearnerAuthClientErrorCode

  constructor(code: LearnerAuthClientErrorCode) {
    super(`Learner authentication failed: ${code}`)
    this.name = "LearnerAuthClientError"
    this.code = code
  }
}

export function isLearnerAuthClientError(
  error: unknown
): error is LearnerAuthClientError {
  return error instanceof LearnerAuthClientError
}

export function createLearnerAuthClient(input: {
  readonly fetch: FetchImplementation
}): LearnerAuthClient {
  const authClient = createAuthClient({
    fetchOptions: { customFetchImpl: input.fetch },
  })

  return {
    async requestPasswordReset(resetInput) {
      const result = await authClient.requestPasswordReset(resetInput)
      assertSuccessful(result, "password-reset-request")
    },
    async resendVerificationEmail(verificationInput) {
      const result = await authClient.sendVerificationEmail(verificationInput)
      assertSuccessful(result, "email-delivery")
    },
    async signInWithEmail(credentials) {
      const result = await authClient.signIn.email(credentials)
      assertSuccessful(result, "authentication")
    },
    async resetPassword(resetInput) {
      const result = await authClient.resetPassword(resetInput)
      assertSuccessful(result, "password-reset")
    },
    async signInWithGoogle({ callbackURL, errorCallbackURL }) {
      await authClient.signIn.social({
        callbackURL,
        errorCallbackURL,
        provider: "google",
      })
    },
    async signUpWithEmail(credentials) {
      const result = await authClient.signUp.email(credentials)
      assertSuccessful(result, "registration")
    },
    async signOut() {
      const response = await input.fetch("/api/auth/sign-out", {
        credentials: "include",
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to sign out")
      }
    },
  }
}

type BetterAuthClientResult = Readonly<{
  error: Readonly<{
    code?: string | undefined
    status?: number | undefined
    statusCode?: number | undefined
  }> | null
}>

function assertSuccessful(
  result: BetterAuthClientResult,
  operation:
    | "authentication"
    | "email-delivery"
    | "password-reset"
    | "password-reset-request"
    | "registration"
): void {
  if (result.error === null) return

  throw new LearnerAuthClientError(mapErrorCode(result.error, operation))
}

function mapErrorCode(
  error: NonNullable<BetterAuthClientResult["error"]>,
  operation:
    | "authentication"
    | "email-delivery"
    | "password-reset"
    | "password-reset-request"
    | "registration"
): LearnerAuthClientErrorCode {
  if (error.status === 429 || error.statusCode === 429) {
    return "rate-limited"
  }

  switch (error.code) {
    case "EMAIL_NOT_VERIFIED":
      return "email-not-verified"
    case "INVALID_EMAIL":
      return "invalid-email"
    case "INVALID_EMAIL_OR_PASSWORD":
      return "invalid-credentials"
    case "INVALID_TOKEN":
      return "invalid-reset-token"
    case "INVALID_PASSWORD":
    case "PASSWORD_TOO_LONG":
    case "PASSWORD_TOO_SHORT":
      return "weak-password"
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "duplicate-email"
    default:
      return operation === "email-delivery"
        ? "email-delivery-failed"
        : "unknown"
  }
}
