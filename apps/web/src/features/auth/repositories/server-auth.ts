import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { env } from "@/foundation/config/env"
import { resolveServerApiBaseUrl } from "@/foundation/lib/api-base-url"
import type { SessionSnapshot } from "@/domain/auth"

type SessionRequestContext = {
  cookie: string | null
  requestHost: string | null
}

type SessionAccess = "protected" | "public"

export type { SessionSnapshot }

export function isLocalPhaseOneMode(): boolean {
  return env.NEXT_PUBLIC_PHASE_ONE_MODE === "local"
}

export function resolveSessionApiBaseUrl(
  apiBaseUrl: string | undefined,
  requestHost: string | null
): string {
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required in api mode.")
  }

  return resolveServerApiBaseUrl(apiBaseUrl, requestHost)
}

async function readSessionRequestContext(): Promise<SessionRequestContext> {
  const requestHeaders = await headers()

  return {
    cookie: requestHeaders.get("cookie"),
    requestHost:
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  }
}

export async function fetchSessionSnapshot(input: {
  apiBaseUrl: string | undefined
  cookie?: string | null
  fetchImpl?: typeof fetch
  requestHost: string | null
}): Promise<SessionSnapshot | null> {
  const response = await (input.fetchImpl ?? fetch)(
    `${resolveSessionApiBaseUrl(input.apiBaseUrl, input.requestHost)}/session`,
    {
      cache: "no-store",
      headers: input.cookie
        ? {
            cookie: input.cookie,
          }
        : undefined,
    }
  )

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error("세션 상태를 확인하지 못했습니다.")
  }

  return (await response.json()) as SessionSnapshot
}

export function getSessionAccessRedirectPath(input: {
  access: SessionAccess
  isLocalMode: boolean
  session: SessionSnapshot | null
}): "/home" | "/sign-in" | null {
  if (input.access === "protected") {
    return input.isLocalMode || input.session ? null : "/sign-in"
  }

  if (input.isLocalMode || input.session) {
    return "/home"
  }

  return null
}

export async function getCurrentSession(): Promise<SessionSnapshot | null> {
  if (isLocalPhaseOneMode()) {
    return null
  }

  const requestContext = await readSessionRequestContext()

  return fetchSessionSnapshot({
    apiBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    cookie: requestContext.cookie,
    requestHost: requestContext.requestHost,
  })
}

export async function redirectIfProtectedAccessMissing(): Promise<void> {
  const isLocalMode = isLocalPhaseOneMode()
  const session = await getCurrentSession()
  const redirectPath = getSessionAccessRedirectPath({
    access: "protected",
    isLocalMode,
    session,
  })

  if (redirectPath) {
    redirect(redirectPath)
  }
}

export async function redirectIfPublicAuthUnavailable(): Promise<void> {
  const isLocalMode = isLocalPhaseOneMode()
  const session = isLocalMode ? null : await getCurrentSession()
  const redirectPath = getSessionAccessRedirectPath({
    access: "public",
    isLocalMode,
    session,
  })

  if (redirectPath) {
    redirect(redirectPath)
  }
}
