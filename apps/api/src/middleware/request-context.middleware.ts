import type { MiddlewareHandler } from "hono"

import {
  createRequestContext,
  type ApiDependencies,
} from "@/context/create-request-context"
import type { ApiHonoEnv } from "@/context/hono-env"

export function createRequestContextMiddleware(
  dependencies: ApiDependencies
): MiddlewareHandler<ApiHonoEnv> {
  return async (context, next) => {
    context.set("requestContext", createRequestContext(dependencies))

    await next()
  }
}
