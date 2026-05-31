import type { Context } from "hono"
import { z } from "zod"

import type { AuthRuntime } from "@/auth/session"
import { unauthorizedError } from "@/auth/session"

type JsonErrorStatusCode = 400 | 401 | 404 | 409 | 429 | 500 | 503

type UserSession = NonNullable<Awaited<ReturnType<AuthRuntime["getSession"]>>>

type RouteResult<TValue, TErrorStatus extends string> =
  | {
      readonly status: "ok"
      readonly value: TValue
    }
  | {
      readonly status: Exclude<TErrorStatus, "ok">
      readonly error: unknown
    }

export const unauthorizedErrorDtoSchema = z.object({
  code: z.literal("unauthorized"),
  message: z.string(),
})

export async function requireUserSession(
  context: Context,
  auth: AuthRuntime
): Promise<
  | {
      readonly status: "ok"
      readonly session: UserSession
    }
  | {
      readonly status: "unauthorized"
      readonly response: Response
    }
> {
  const session = await auth.getSession(context.req.raw.headers)

  if (!session) {
    return {
      status: "unauthorized",
      response: context.json(unauthorizedError, 401),
    }
  }

  return {
    status: "ok",
    session,
  }
}

export async function parseJsonBody<TValue>(
  context: Context,
  schema: z.ZodType<TValue>,
  invalidMessage: string
): Promise<
  | {
      readonly status: "ok"
      readonly data: TValue
    }
  | {
      readonly status: "invalid-request"
      readonly response: Response
    }
> {
  const input = schema.safeParse(await readJsonBody(context.req.raw))

  if (!input.success) {
    return {
      status: "invalid-request",
      response: context.json(invalidRequest(invalidMessage), 400),
    }
  }

  return {
    status: "ok",
    data: input.data,
  }
}

export function jsonServiceResult<TValue, TErrorStatus extends string>(
  context: Context,
  result: RouteResult<TValue, TErrorStatus>,
  statusCodes: Readonly<Record<TErrorStatus, JsonErrorStatusCode>>
) {
  if ("value" in result) {
    return context.json(result.value)
  }

  const statusCode = statusCodes[result.status]

  if (statusCode === undefined) {
    throw new Error(`Unhandled service result status: ${result.status}`)
  }

  return context.json(result.error, statusCode)
}

export function invalidRequest(message: string) {
  return {
    code: "invalid-request",
    message,
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
