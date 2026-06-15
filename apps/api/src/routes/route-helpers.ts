import type { Context } from "hono"
import { resolveBearerSession } from "@workspace/core/auth"
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
  const sessionResult = await resolveBearerSession({
    authorizationHeader: context.req.header("Authorization") ?? null,
    sessionResolver,
  })

  if (sessionResult.kind === "err") {
    return sessionResult
  }

  if (sessionResult.session.user.status !== learnerAccountStatuses.active) {
    return {
      code: "account_unavailable",
      kind: "err",
      status: 403,
    }
  }

  return {
    kind: "ok",
    session: sessionResult.session,
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
