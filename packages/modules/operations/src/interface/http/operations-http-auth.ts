import type { MiddlewareHandler } from "hono"
import type { HttpPlatformEnv } from "@workspace/http-platform/context"
import { AppError } from "@workspace/http-platform/errors"
import { withPrivateNoStore } from "@workspace/http-platform/security"

import type { OperationsAdminSessionPort } from "#operations/application/ports/operations-ports"
import type { OperationsActor } from "#operations/domain/operations-actor"

export type OperationsHonoEnv = HttpPlatformEnv<{
  operationsActor: OperationsActor
}>

export function operationsSessionRouteOptions(
  sessionPort: OperationsAdminSessionPort
) {
  return {
    middleware: [createSessionMiddleware(sessionPort)],
    security: [{ adminSessionCookie: [] }],
  }
}

function createSessionMiddleware(
  sessionPort: OperationsAdminSessionPort
): MiddlewareHandler<OperationsHonoEnv> {
  return async (context, next) => {
    const actor = await sessionPort.resolveActor(context.req.raw.headers)
    if (actor === null) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
        status: 401,
      })
    }
    context.set("operationsActor", actor)
    await next()
    context.res = withPrivateNoStore(context.res)
  }
}
