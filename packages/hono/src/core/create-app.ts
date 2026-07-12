import { OpenAPIHono } from "@hono/zod-openapi"
import {
  createErrorHandler,
  createNotFoundHandler,
  createValidationErrorHook,
} from "#hono/errors"
import type { CreateAppOptions } from "#hono/core/types"

export function createApp<const TRoutes extends CreateAppOptions["routes"]>(
  options: CreateAppOptions<TRoutes>
) {
  const app = new OpenAPIHono({
    defaultHook: createValidationErrorHook(),
  })

  for (const middleware of options.middleware ?? []) {
    app.use("*", middleware)
  }

  for (const route of options.routes) {
    app.openapi(route.route as never, route.handler as never)
  }

  app.notFound(createNotFoundHandler())
  app.onError(createErrorHandler(options.errorLogger))

  return app
}
