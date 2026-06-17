import type { Context } from "hono"
import type { z } from "zod"
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

export type JsonBodyReadError = {
  readonly cause: unknown
  readonly kind: "malformed-json" | "unknown-body-read-error"
}

export type JsonBodyParseError =
  | JsonBodyReadError
  | {
      readonly cause: unknown
      readonly kind: "invalid-body"
    }

export type JsonBodyParseResult<TValue> =
  | {
      readonly kind: "ok"
      readonly value: TValue
    }
  | {
      readonly error: JsonBodyParseError
      readonly kind: "err"
    }

export async function parseJsonBody<TSchema extends z.ZodType>(
  context: Context,
  schema: TSchema
): Promise<JsonBodyParseResult<z.infer<TSchema>>> {
  let value: unknown

  try {
    value = await context.req.json()
  } catch (error) {
    return {
      error: classifyJsonBodyReadError(error),
      kind: "err",
    }
  }

  const result = schema.safeParse(value)

  if (!result.success) {
    return {
      error: {
        cause: result.error,
        kind: "invalid-body",
      },
      kind: "err",
    }
  }

  return {
    kind: "ok",
    value: result.data,
  }
}

export function jsonBodyErrorDetail(error: JsonBodyParseError): {
  readonly code: "invalid_body" | "malformed_json" | "unknown_body_read_error"
} {
  if (error.kind === "malformed-json") {
    return { code: "malformed_json" }
  }

  if (error.kind === "invalid-body") {
    return { code: "invalid_body" }
  }

  return { code: "unknown_body_read_error" }
}

function classifyJsonBodyReadError(error: unknown): JsonBodyReadError {
  if (error instanceof SyntaxError) {
    return {
      cause: error,
      kind: "malformed-json",
    }
  }

  return {
    cause: error,
    kind: "unknown-body-read-error",
  }
}
