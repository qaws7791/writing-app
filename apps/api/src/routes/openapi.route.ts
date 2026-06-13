import { Hono } from "hono"

export function createOpenApiRoute(): Hono {
  const route = new Hono()

  route.get("/", (context) =>
    context.json({
      info: {
        title: "Writing App API",
        version: "0.0.0",
      },
      openapi: "3.1.0",
      paths: {},
    })
  )

  return route
}
