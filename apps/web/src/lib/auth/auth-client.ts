import { createAuthClient } from "better-auth/react"

import { getSafeNextPath } from "@/lib/auth/auth-navigation"

export type AuthMode = "login" | "signup"

export type AuthFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

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

export type EmailAuthResult =
  | {
      status: "ok"
    }
  | {
      message: string
      status: "error"
    }

export interface RequestEmailAuthInput {
  baseUrl?: string
  email: string
  fetch?: AuthFetch
  mode: AuthMode
  name?: string
  password: string
}

export interface RequestGoogleAuthInput {
  appOrigin?: string
  baseUrl?: string
  callbackPath?: string
  createClient?: CreateSocialAuthClient
}

const createBetterAuthSocialClient: CreateSocialAuthClient = ({ baseURL }) =>
  createAuthClient(baseURL ? { baseURL } : {})

export async function requestEmailAuth({
  baseUrl,
  email,
  fetch = globalThis.fetch,
  mode,
  name,
  password,
}: RequestEmailAuthInput): Promise<EmailAuthResult> {
  const response = await fetch(getEmailAuthUrl(baseUrl, mode), {
    body: JSON.stringify(getEmailAuthBody({ email, mode, name, password })),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (response.ok) {
    return { status: "ok" }
  }

  return {
    status: "error",
    message: await getAuthErrorMessage(response),
  }
}

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

function getEmailAuthUrl(baseUrl: string | undefined, mode: AuthMode) {
  const path =
    mode === "login" ? "/api/auth/sign-in/email" : "/api/auth/sign-up/email"

  return `${normalizeBaseUrl(baseUrl)}${path}`
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

function getEmailAuthBody({
  email,
  mode,
  name,
  password,
}: Pick<RequestEmailAuthInput, "email" | "mode" | "name" | "password">) {
  if (mode === "signup") {
    return {
      email,
      name: name ?? "",
      password,
    }
  }

  return {
    email,
    password,
  }
}

async function getAuthErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: unknown }

    if (typeof body.message === "string" && body.message.length > 0) {
      return body.message
    }
  } catch {
    return "인증 요청에 실패했습니다."
  }

  return "인증 요청에 실패했습니다."
}
