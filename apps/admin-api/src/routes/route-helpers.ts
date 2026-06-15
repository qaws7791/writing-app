import type { Context } from "hono"
import { resolveBearerSession } from "@workspace/core/auth"

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
  const sessionResult = await resolveBearerSession({
    authorizationHeader: context.req.header("Authorization") ?? null,
    sessionResolver,
  })

  if (sessionResult.kind === "err") {
    return sessionResult
  }

  return {
    kind: "ok",
    session: sessionResult.session,
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

  if (sessionResult.session.admin.role !== "owner") {
    return {
      code: "forbidden",
      kind: "err",
      status: 403,
    }
  }

  return sessionResult
}
