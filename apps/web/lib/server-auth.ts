import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { env } from "@/env"
import { resolveServerApiBaseUrl } from "./api-base-url"

type AuthenticatedSession = {
  createdAt: string
  expiresAt: string
  id: string
  ipAddress?: string | null
  token: string
  updatedAt: string
  userAgent?: string | null
  userId: string
}

type AuthenticatedUser = {
  email: string
  emailVerified: boolean
  id: string
  image?: string | null
  name: string
}

export type SessionSnapshot = {
  session: AuthenticatedSession
  user: AuthenticatedUser
}

export function isLocalPhaseOneMode(): boolean {
  return env.NEXT_PUBLIC_PHASE_ONE_MODE === "local"
}

function getApiBaseUrl(requestHost: string | null): string {
  const apiBaseUrl = env.NEXT_PUBLIC_API_BASE_URL

  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required in api mode.")
  }

  return resolveServerApiBaseUrl(apiBaseUrl, requestHost)
}

export async function getCurrentSession(): Promise<SessionSnapshot | null> {
  if (isLocalPhaseOneMode()) {
    return null
  }

  const requestHeaders = await headers()
  const requestHost =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
  const cookie = requestHeaders.get("cookie")
  const response = await fetch(`${getApiBaseUrl(requestHost)}/session`, {
    cache: "no-store",
    headers: cookie
      ? {
          cookie,
        }
      : undefined,
  })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error("세션 상태를 확인하지 못했습니다.")
  }

  return (await response.json()) as SessionSnapshot
}

export async function redirectIfProtectedAccessMissing(): Promise<void> {
  if (isLocalPhaseOneMode()) {
    return
  }

  const session = await getCurrentSession()
  if (!session) {
    redirect("/sign-in")
  }
}

export async function redirectIfPublicAuthUnavailable(): Promise<void> {
  if (isLocalPhaseOneMode()) {
    redirect("/home")
  }

  const session = await getCurrentSession()
  if (session) {
    redirect("/home")
  }
}
