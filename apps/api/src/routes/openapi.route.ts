import type { Hono } from "hono"
import { openAPIRouteHandler } from "hono-openapi"

export function registerOpenApiRoute(app: Hono) {
  app.get(
    "/openapi.json",
    openAPIRouteHandler(app, {
      documentation: {
        info: {
          title: "Writing App API",
          version: "0.0.1",
        },
        openapi: "3.1.0",
      },
    })
  )
}
