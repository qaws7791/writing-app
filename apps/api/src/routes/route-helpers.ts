import type { Context } from "hono"
import type { z } from "zod"
import { learnerAccountStatuses } from "@workspace/core/status"

import {
  type AuthenticatedSession,
  type SessionResolver,
} from "@workspace/core/auth"

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
      readonly error: JsonBodyReadError
      readonly kind: "err"
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

export async function readJsonBody(context: Context): Promise<JsonBodyResult> {
  try {
    return {
      kind: "ok",
      value: await context.req.json(),
    }
  } catch (error) {
    return {
      error: classifyJsonBodyReadError(error),
      kind: "err",
    }
  }
}

export async function parseJsonBody<TSchema extends z.ZodType>(
  context: Context,
  schema: TSchema
): Promise<JsonBodyParseResult<z.infer<TSchema>>> {
  const body = await readJsonBody(context)

  if (body.kind === "err") {
    return body
  }

  const result = schema.safeParse(body.value)

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
