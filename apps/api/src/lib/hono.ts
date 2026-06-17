import {
  createRoute as createOpenApiRoute,
  OpenAPIHono,
  type OpenAPIHonoOptions,
  type RouteConfig,
  type RouteHandler,
} from "@hono/zod-openapi"
import type { Context, Env, Handler } from "hono"
import type { z } from "zod"

import { errorResponse } from "@/lib/error-response"

const validationHook: NonNullable<OpenAPIHonoOptions<Env>["defaultHook"]> = (
  result,
  context
) => {
  if (result.success) {
    return
  }

  return context.json(
    errorResponse(
      "invalid_request",
      result.target === "json" ? { code: "invalid_body" } : undefined
    ),
    400
  )
}

export function createOpenApiApp(): OpenAPIHono {
  return new OpenAPIHono({
    defaultHook: validationHook,
  })
}

export function createRoute(
  routeConfig: RouteConfig,
  handler: Handler
): OpenAPIHono {
  const app = createOpenApiApp()

  app.openapi(
    createOpenApiRoute(routeConfig),
    handler as RouteHandler<RouteConfig>
  )

  return app
}

export function readValidatedJson<TSchema extends z.ZodType>(
  context: Context,
  schema: TSchema
): z.output<TSchema> {
  return schema.parse(readValidatedTarget(context, "json"))
}

export function readValidatedParam<TSchema extends z.ZodType>(
  context: Context,
  schema: TSchema
): z.output<TSchema> {
  return schema.parse(readValidatedTarget(context, "param"))
}

function readValidatedTarget(
  context: Context,
  target: "json" | "param"
): unknown {
  return (context.req as ValidatedRequest).valid(target)
}

type ValidatedRequest = {
  readonly valid: (target: "json" | "param") => unknown
}
