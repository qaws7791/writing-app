import {
  createLearnerAuthClient,
  type LearnerAuthClient,
} from "@workspace/auth/learner/client"

import { resolveSafeNextPath } from "@/features/authentication/model/auth-navigation"

export async function requestGoogleLogin(nextPath: string): Promise<void> {
  await getDefaultWebAuthClient().requestGoogleLogin(nextPath)
}

export function requestTestLogin(nextPath: string): void {
  getDefaultWebAuthClient().requestTestLogin(nextPath)
}

export async function requestLogout(callbackPath: string): Promise<string> {
  return getDefaultWebAuthClient().requestLogout(callbackPath)
}

export type WebAuthClient = {
  readonly requestGoogleLogin: (nextPath: string) => Promise<void>
  readonly requestLogout: (callbackPath: string) => Promise<string>
  readonly requestTestLogin: (nextPath: string) => void
}

type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export function createWebAuthClient({
  fetchImplementation = globalThis.fetch.bind(globalThis),
  learnerAuthClientFactory = createLearnerAuthClient,
  navigate = (url) => window.location.assign(url),
}: {
  readonly fetchImplementation?: FetchImplementation
  readonly learnerAuthClientFactory?: (input: {
    readonly fetch: FetchImplementation
    readonly navigate: (url: string) => void
  }) => LearnerAuthClient
  readonly navigate?: (url: string) => void
} = {}): WebAuthClient {
  const authClient = learnerAuthClientFactory({
    fetch: fetchImplementation,
    navigate,
  })

  return {
    async requestGoogleLogin(nextPath) {
      await authClient.signInWithGoogle(createCallbackUrl(nextPath))
    },
    requestTestLogin(nextPath) {
      authClient.signInForTest(createCallbackUrl(nextPath))
    },
    async requestLogout(callbackPath) {
      const safeCallbackPath = resolveSafeNextPath(callbackPath)
      await authClient.signOut()

      return safeCallbackPath
    },
  }
}

function createCallbackUrl(nextPath: string): string {
  const browserOrigin =
    typeof window === "undefined" ? "" : window.location.origin

  return new URL(resolveSafeNextPath(nextPath), browserOrigin).toString()
}

function getDefaultWebAuthClient(): WebAuthClient {
  return createWebAuthClient()
}
