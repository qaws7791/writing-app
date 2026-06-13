import { Hono } from "hono"

import { createOpenApiDocument } from "@/openapi/openapi-document"

export function createOpenApiRoute(): Hono {
  const route = new Hono()

  route.get("/", (context) => context.json(createOpenApiDocument()))

  return route
}
