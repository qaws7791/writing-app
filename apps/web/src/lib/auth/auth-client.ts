import { createAuthClient } from "better-auth/react"

import { getSafeNextPath } from "@/lib/auth/auth-navigation"

export type SocialAuthClient = {
  signIn: {
    social: (input: GoogleSocialAuthInput) => Promise<unknown>
  }
}

export type CreateSocialAuthClient = (input: {
  baseURL?: string
}) => SocialAuthClient

export type GoogleSocialAuthInput = {
  callbackURL: string
  provider: "google"
}

export interface RequestGoogleAuthInput {
  appOrigin?: string
  baseUrl?: string
  callbackPath?: string
  createClient?: CreateSocialAuthClient
}

const createBetterAuthSocialClient: CreateSocialAuthClient = ({ baseURL }) =>
  createAuthClient(baseURL ? { baseURL } : {})

export async function requestGoogleAuth({
  appOrigin,
  baseUrl,
  callbackPath,
  createClient = createBetterAuthSocialClient,
}: RequestGoogleAuthInput) {
  const baseURL = normalizeBaseUrl(baseUrl)
  const client = createClient(baseURL ? { baseURL } : {})

  await client.signIn.social({
    callbackURL: getGoogleCallbackUrl({
      appOrigin: appOrigin ?? getCurrentOrigin(),
      callbackPath,
    }),
    provider: "google",
  })
}

function normalizeBaseUrl(baseUrl = "") {
  return baseUrl.replace(/\/$/, "")
}

function getGoogleCallbackUrl({
  appOrigin,
  callbackPath,
}: Pick<RequestGoogleAuthInput, "appOrigin" | "callbackPath">) {
  const safePath = getSafeNextPath(callbackPath)

  if (!appOrigin || appOrigin === "null") {
    return safePath
  }

  return `${normalizeBaseUrl(appOrigin)}${safePath}`
}

function getCurrentOrigin() {
  return globalThis.location?.origin
}
