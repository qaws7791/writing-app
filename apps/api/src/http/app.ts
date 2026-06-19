import type { MiddlewareHandler } from "hono"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { createApp as createHonoApp } from "@workspace/hono/core"
import { createRequestLoggingMiddleware } from "@workspace/logger"

import {
  type ApiDependencies,
  type ApiRequestContext,
} from "@/context/create-request-context"
import { createCorsMiddleware } from "@/middleware/cors.middleware"
import { createRequestContextMiddleware } from "@/middleware/request-context.middleware"
import { registerApiBootstrapRoutes, routes } from "@/routes"

export type { ApiDependencies, ApiRequestContext }
export { createOpenApiDocument } from "@/http/openapi"
export type { ApiOpenApiDocument } from "@/http/openapi"

export function createApp(dependencies: ApiDependencies): OpenAPIHono {
  const app = createHonoApp({
    middleware: createMiddleware(dependencies),
    routes,
  })

  registerApiBootstrapRoutes(app, dependencies)

  return app
}

function createMiddleware(
  dependencies: ApiDependencies
): readonly MiddlewareHandler[] {
  const middleware: MiddlewareHandler[] = [
    createRequestContextMiddleware(dependencies),
  ]

  if (dependencies.requestLogger !== undefined) {
    middleware.push(
      createRequestLoggingMiddleware({
        createRequestId: dependencies.requestLoggingRuntime?.createRequestId,
        logRequest: dependencies.requestLogger,
        readMonotonicTimeMs:
          dependencies.requestLoggingRuntime?.readMonotonicTimeMs,
      })
    )
  }

  middleware.push(createCorsMiddleware(dependencies))

  return middleware
}
