import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { env } from "@/foundation/config/env"
import { SessionRepository } from "@/features/auth/repositories/session-repository"
import type { SessionSnapshot } from "@/domain/auth"

type SessionRequestContext = {
  cookie: string | null
  requestHost: string | null
}

type SessionAccess = "protected" | "public"

export type { SessionSnapshot }

export function isLocalMode(): boolean {
  return env.NEXT_PUBLIC_CLIENT_MODE === "local"
}

async function readSessionRequestContext(): Promise<SessionRequestContext> {
  const requestHeaders = await headers()

  return {
    cookie: requestHeaders.get("cookie"),
    requestHost:
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  }
}

export async function fetchSessionSnapshot(): Promise<SessionSnapshot | null> {
  if (isLocalMode()) {
    return null
  }

  const requestContext = await readSessionRequestContext()
  const repository = new SessionRepository({
    cookie: requestContext.cookie,
    requestHost: requestContext.requestHost,
  })

  return repository.getSession()
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
  return fetchSessionSnapshot()
}

export async function redirectIfProtectedAccessMissing(): Promise<void> {
  const localMode = isLocalMode()
  const session = await getCurrentSession()
  const redirectPath = getSessionAccessRedirectPath({
    access: "protected",
    isLocalMode: localMode,
    session,
  })

  if (redirectPath) {
    redirect(redirectPath)
  }
}

export async function redirectIfPublicAuthUnavailable(): Promise<void> {
  const localMode = isLocalMode()
  const session = localMode ? null : await getCurrentSession()
  const redirectPath = getSessionAccessRedirectPath({
    access: "public",
    isLocalMode: localMode,
    session,
  })

  if (redirectPath) {
    redirect(redirectPath)
  }
}
