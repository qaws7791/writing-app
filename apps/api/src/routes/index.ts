import type { OpenAPIHono } from "@hono/zod-openapi"

import type { ApiDependencies } from "@/context/create-request-context"
import { createOpenApiDocument } from "@/http/openapi"
import { registerAuthProxy } from "@/modules/auth/auth-proxy"
import { healthRoute } from "@/modules/health/health.routes"

export const routes = [healthRoute] as const

export function registerApiBootstrapRoutes(
  app: OpenAPIHono,
  dependencies: Pick<ApiDependencies, "authHandler">
): void {
  registerAuthProxy(app, dependencies.authHandler)
  app.get("/openapi", (context) => context.json(createOpenApiDocument(app)))
}
