import type { MiddlewareHandler } from "hono"
import type { HttpPlatformEnv } from "@workspace/http-platform/context"
import { AppError } from "@workspace/http-platform/errors"
import { withPrivateNoStore } from "@workspace/http-platform/security"

import type { ResourceAdminSessionPort } from "#resource-library/application/ports/resource-library-ports"
import {
  authorizeResourceAccess,
  type ResourceActor,
} from "#resource-library/domain/resource-access-policy"

export type ResourceLibraryHonoEnv = HttpPlatformEnv<{
  resourceActor: ResourceActor
}>

export function resourceLibrarySessionRouteOptions(
  sessionPort: ResourceAdminSessionPort
) {
  return {
    middleware: [createRequireResourceLibrarySessionMiddleware(sessionPort)],
    security: [{ adminSessionCookie: [] }],
  }
}

function createRequireResourceLibrarySessionMiddleware(
  sessionPort: ResourceAdminSessionPort
): MiddlewareHandler<ResourceLibraryHonoEnv> {
  return async (context, next) => {
    const actor = await sessionPort.resolveActor(context.req.raw.headers)
    if (actor === null) throw unauthorizedResourceLibraryError()
    if (authorizeResourceAccess(actor) === "forbidden") {
      throw forbiddenResourceLibraryError()
    }

    context.set("resourceActor", actor)
    await next()
    context.res = withPrivateNoStore(context.res)
  }
}

function unauthorizedResourceLibraryError(): AppError {
  return new AppError({
    code: "UNAUTHORIZED",
    message: "Unauthorized",
    status: 401,
  })
}

function forbiddenResourceLibraryError(): AppError {
  return new AppError({
    code: "FORBIDDEN",
    message: "Forbidden",
    status: 403,
  })
}
