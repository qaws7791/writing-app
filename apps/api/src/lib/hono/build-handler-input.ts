import type { Context, Env } from "hono"
import type { ZodType } from "zod"

import type { HandlerInput, InjectMap } from "./define-route"

type ValidatedRequest = {
  valid(target: "json" | "param" | "query"): unknown
}

type RequestConfig<TBody, TQuery, TParams> = {
  body?: TBody
  params?: TParams
  query?: TQuery
}

export function buildHandlerInput<
  TEnv extends Env,
  TBody extends ZodType | undefined,
  TQuery extends ZodType | undefined,
  TParams extends ZodType | undefined,
  TInject extends InjectMap,
>(
  context: Context<TEnv>,
  inject: TInject | undefined,
  request: RequestConfig<TBody, TQuery, TParams> | undefined
): HandlerInput<TEnv, TBody, TQuery, TParams, TInject> {
  const input: Record<string, unknown> = { context }
  const contextVariables = context.var as Record<string, unknown>
  const validatedRequest = context.req as ValidatedRequest

  if (inject) {
    for (const [handlerKey, token] of Object.entries(inject)) {
      input[handlerKey] = contextVariables[token.key]
    }
  }

  if (request?.body) input.body = validatedRequest.valid("json")
  if (request?.query) input.query = validatedRequest.valid("query")
  if (request?.params) input.params = validatedRequest.valid("param")

  return input as HandlerInput<TEnv, TBody, TQuery, TParams, TInject>
}
