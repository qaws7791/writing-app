import { createAuthClient } from "better-auth/react"

import { resolveSafeNextPath } from "@/lib/auth/auth-navigation"
import {
  buildApiUrl,
  readBrowserApiBaseUrl,
  type BrowserApiBaseUrl,
} from "@/runtime-config"

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

type BetterAuthClientFactory = (input: { readonly baseURL: string }) => {
  readonly signIn: {
    readonly social: (input: {
      readonly callbackURL: string
      readonly provider: "google"
    }) => Promise<unknown>
  }
}

type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export function createWebAuthClient({
  apiBaseUrl,
  betterAuthClientFactory = createAuthClient,
  fetchImplementation = globalThis.fetch.bind(globalThis),
}: {
  readonly apiBaseUrl: BrowserApiBaseUrl
  readonly betterAuthClientFactory?: BetterAuthClientFactory
  readonly fetchImplementation?: FetchImplementation
}): WebAuthClient {
  return {
    async requestGoogleLogin(nextPath) {
      await betterAuthClientFactory({
        baseURL: apiBaseUrl,
      }).signIn.social({
        callbackURL: createCallbackUrl(nextPath),
        provider: "google",
      })
    },
    requestTestLogin(nextPath) {
      window.location.assign(
        buildApiUrl(
          apiBaseUrl,
          `/api/auth/test/sign-in?callbackURL=${encodeURIComponent(
            createCallbackUrl(nextPath)
          )}`
        )
      )
    },
    async requestLogout(callbackPath) {
      const safeCallbackPath = resolveSafeNextPath(callbackPath)
      const response = await fetchImplementation(
        buildApiUrl(apiBaseUrl, "/api/auth/sign-out"),
        {
          credentials: "include",
          method: "POST",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to sign out")
      }

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
  return createWebAuthClient({
    apiBaseUrl: readBrowserApiBaseUrl(),
  })
}
