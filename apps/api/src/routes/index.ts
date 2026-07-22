import type { OpenAPIHono } from "@hono/zod-openapi"

import type { ApiDependencies } from "@/context/create-request-context"
import { createOpenApiDocument } from "@/http/openapi"
import { registerAuthProxy } from "@/http/auth-proxy"
import { createHealthRoutes } from "@/http/health-routes"

export function createApiFoundationRoutes(
  dependencies: Pick<ApiDependencies, "health">
) {
  return createHealthRoutes(dependencies.health)
}

export function registerApiBootstrapRoutes(
  app: OpenAPIHono,
  dependencies: Pick<ApiDependencies, "authHandler">
): void {
  registerAuthProxy(app, dependencies.authHandler)
  app.get("/openapi", (context) => context.json(createOpenApiDocument(app)))
}
