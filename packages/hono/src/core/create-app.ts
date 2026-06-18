import { OpenAPIHono } from "@hono/zod-openapi"
import {
  createErrorHandler,
  createNotFoundHandler,
  createValidationErrorHook,
} from "@/errors"
import type { CreateAppOptions } from "@/core/types"

export function createApp<const TRoutes extends CreateAppOptions["routes"]>(
  options: CreateAppOptions<TRoutes>
) {
  const app = new OpenAPIHono({
    defaultHook: createValidationErrorHook(),
  })

  for (const route of options.routes) {
    app.openapi(route.route as never, route.handler as never)
  }

  app.notFound(createNotFoundHandler())
  app.onError(createErrorHandler())

  return app
}
