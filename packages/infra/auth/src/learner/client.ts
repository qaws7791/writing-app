import { createAuthClient } from "better-auth/client"

import type { FetchImplementation } from "#auth/shared/client"

export type LearnerAuthClient = {
  readonly signInForTest: (callbackURL: string) => void
  readonly signInWithGoogle: (callbackURL: string) => Promise<void>
  readonly signOut: () => Promise<void>
}

export function createLearnerAuthClient(input: {
  readonly fetch: FetchImplementation
  readonly navigate: (url: string) => void
}): LearnerAuthClient {
  const authClient = createAuthClient({
    fetchOptions: { customFetchImpl: input.fetch },
  })

  return {
    signInForTest(callbackURL) {
      input.navigate(
        `/api/auth/test/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`
      )
    },
    async signInWithGoogle(callbackURL) {
      await authClient.signIn.social({
        callbackURL,
        provider: "google",
      })
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
