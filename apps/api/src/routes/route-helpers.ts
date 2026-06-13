import type { Context } from "hono"

import {
  readBearerToken,
  type AuthenticatedSession,
  type SessionResolver,
} from "@/auth/session"

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
  const token = readBearerToken(context.req.header("Authorization") ?? null)

  if (token === null) {
    return {
      code: "unauthorized",
      kind: "err",
      status: 401,
    }
  }

  const session = await sessionResolver.resolveSession(token)

  if (session === null) {
    return {
      code: "unauthorized",
      kind: "err",
      status: 401,
    }
  }

  if (session.user.status !== "active") {
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
