import type { Context } from "hono"
import { learnerAccountStatuses } from "@workspace/core/status"

import { type AuthenticatedSession, type SessionResolver } from "@/auth/session"

export type ActiveSessionResult =
  | {
      readonly kind: "ok"
      readonly session: AuthenticatedSession
    }
  | {
      readonly code: "account_unavailable" | "unauthorized"
      readonly kind: "err"
      readonly status: 401 | 403
    }

export async function resolveActiveSession(
  context: Context,
  sessionResolver: SessionResolver
): Promise<ActiveSessionResult> {
  const session = await sessionResolver.resolveSession(context.req.raw.headers)

  if (session === null) {
    return {
      code: "unauthorized",
      kind: "err",
      status: 401,
    }
  }

  if (session.user.status !== learnerAccountStatuses.active) {
    return {
      code: "account_unavailable",
      kind: "err",
      status: 403,
    }
  }

  return {
    kind: "ok",
    session,
  }
}

export type JsonBodyResult =
  | {
      readonly kind: "ok"
      readonly value: unknown
    }
  | {
      readonly error: unknown
      readonly kind: "err"
    }

export async function readJsonBody(context: Context): Promise<JsonBodyResult> {
  try {
    return {
      kind: "ok",
      value: await context.req.json(),
    }
  } catch (error) {
    return {
      error,
      kind: "err",
    }
  }
}
