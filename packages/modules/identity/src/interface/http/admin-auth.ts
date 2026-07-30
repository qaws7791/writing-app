import type { MiddlewareHandler } from "hono"
import { AppError } from "@workspace/http-platform/errors"
import {
  setPrivateNoStoreHeaders,
  withPrivateNoStore,
} from "@workspace/http-platform/security"
import type { HttpPlatformEnv } from "@workspace/http-platform/app"

import {
  toAdminActor,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "#identity/application/identity-sessions"
import type { AdminActor } from "#identity/domain/admin-actor"

export type IdentityAdminHonoEnv = HttpPlatformEnv<{
  activeAdminSession: AdminAuthenticatedSession
  adminActor: AdminActor
}>

function createRequireAdminSessionMiddleware(
  sessionResolver: AdminSessionResolver
): MiddlewareHandler<IdentityAdminHonoEnv> {
  return async (context, next) => {
    setPrivateNoStoreHeaders(context)
    const session = await sessionResolver.resolveSession(
      context.req.raw.headers
    )
    if (session === null) throw unauthorizedIdentityError()

    context.set("activeAdminSession", session)
    context.set("adminActor", toAdminActor(session))
    context.set("requestActor", {
      id: session.admin.id,
      type: "admin",
    })
    await next()
    context.res = withPrivateNoStore(context.res)
  }
}

export function adminSessionRouteOptions(
  sessionResolver: AdminSessionResolver
) {
  return {
    middleware: [createRequireAdminSessionMiddleware(sessionResolver)],
    security: [{ adminSessionCookie: [] }],
  }
}

function unauthorizedIdentityError(): AppError {
  return new AppError({
    code: "UNAUTHORIZED",
    message: "Unauthorized",
    status: 401,
  })
}
