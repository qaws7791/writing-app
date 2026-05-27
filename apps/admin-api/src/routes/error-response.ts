import { resolver } from "hono-openapi"
import type { ResolverReturnType } from "hono-openapi"
import type { ZodType } from "zod"

export type JsonErrorResponseContent = {
  "application/json": {
    schema: ResolverReturnType
  }
}

export function jsonErrorResponse(schema: ZodType): JsonErrorResponseContent {
  return {
    "application/json": {
      schema: resolver(schema),
    },
  }
}
