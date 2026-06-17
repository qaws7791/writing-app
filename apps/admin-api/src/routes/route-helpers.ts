import type { Context } from "hono"
import { canAccessOwnerAdminRoute } from "@workspace/core/admin"

import {
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "@/auth/admin-session"

export type AdminSessionResult =
  | {
      readonly kind: "ok"
      readonly session: AdminAuthenticatedSession
    }
  | {
      readonly code: "forbidden" | "unauthorized"
      readonly kind: "err"
      readonly status: 401 | 403
    }

export async function resolveAdminSession(
  context: Context,
  sessionResolver: AdminSessionResolver
): Promise<AdminSessionResult> {
  const session = await sessionResolver.resolveSession(context.req.raw.headers)

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

export async function resolveOwnerAdminSession(
  context: Context,
  sessionResolver: AdminSessionResolver
): Promise<AdminSessionResult> {
  const sessionResult = await resolveAdminSession(context, sessionResolver)

  if (sessionResult.kind === "err") {
    return sessionResult
  }

  if (!canAccessOwnerAdminRoute(sessionResult.session.admin.role)) {
    return {
      code: "forbidden",
      kind: "err",
      status: 403,
    }
  }

  return sessionResult
}
