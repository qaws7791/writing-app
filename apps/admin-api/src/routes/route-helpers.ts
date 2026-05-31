import type { Context } from "hono"
import type { z } from "zod"

type JsonErrorStatusCode = 400 | 401 | 404 | 409 | 429 | 500 | 503

type RouteResult<TValue, TErrorStatus extends string> =
  | {
      readonly status: "ok"
      readonly value: TValue
    }
  | {
      readonly status: Exclude<TErrorStatus, "ok">
      readonly error: unknown
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
      response: context.json(
        {
          code: "invalid-request",
          message: invalidMessage,
        },
        400
      ),
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

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
