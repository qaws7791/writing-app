import type { Context } from "hono"

import {
  readBearerToken,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@/auth/admin-session"

export type AdminSessionResult =
  | {
      readonly kind: "ok"
      readonly session: AdminAuthenticatedSession
    }
  | {
      readonly code: "unauthorized"
      readonly kind: "err"
      readonly status: 401
    }

export async function resolveAdminSession(
  context: Context,
  sessionResolver: AdminSessionResolver
): Promise<AdminSessionResult> {
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

  return {
    kind: "ok",
    session,
  }
}
