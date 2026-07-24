import { OpenAPIHono } from "@hono/zod-openapi"
import type { Env, MiddlewareHandler } from "hono"
import {
  createErrorHandler,
  createNotFoundHandler,
  createValidationErrorHook,
} from "#http-platform/errors/index"

export type CreateAppOptions<TEnv extends Env> = Readonly<{
  errorLogger?: Parameters<typeof createErrorHandler>[0]
  middleware?: readonly MiddlewareHandler<TEnv>[]
}>

export function createApp<TEnv extends Env = Env>(
  options: CreateAppOptions<TEnv> = {}
): OpenAPIHono<TEnv> {
  const app = new OpenAPIHono<TEnv>({
    defaultHook: createValidationErrorHook(),
  })

  for (const middleware of options.middleware ?? []) {
    app.use("*", middleware)
  }

  app.notFound(createNotFoundHandler())
  app.onError(createErrorHandler(options.errorLogger))

  return app
}
