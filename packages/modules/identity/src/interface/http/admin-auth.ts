import type { MiddlewareHandler } from "hono"
import { AppError } from "@workspace/http-platform/errors"
import { withPrivateNoStore } from "@workspace/http-platform/security"
import type { HttpPlatformEnv } from "@workspace/http-platform/context"

import { authorizeOwnerMutation } from "#identity/domain/admin-role"
import {
  toAdminActor,
  type AdminAuthenticatedSession,
  type AdminSessionResolver,
} from "#identity/application/identity-sessions"
import type { AdminActor } from "#identity/domain/admin-role"

export type IdentityAdminHonoEnv = HttpPlatformEnv<{
  activeAdminSession: AdminAuthenticatedSession
  adminActor: AdminActor
}>

export function createRequireAdminSessionMiddleware(
  sessionResolver: AdminSessionResolver
): MiddlewareHandler<IdentityAdminHonoEnv> {
  return async (context, next) => {
    const session = await sessionResolver.resolveSession(
      context.req.raw.headers
    )
    if (session === null) throw unauthorizedIdentityError()

    context.set("activeAdminSession", session)
    context.set("adminActor", toAdminActor(session))
    await next()
    context.res = withPrivateNoStore(context.res)
  }
}

export function createRequireOwnerAdminSessionMiddleware(
  sessionResolver: AdminSessionResolver
): MiddlewareHandler<IdentityAdminHonoEnv> {
  return async (context, next) => {
    const session = await sessionResolver.resolveSession(
      context.req.raw.headers
    )
    if (session === null) throw unauthorizedIdentityError()

    const actor = toAdminActor(session)
    if (authorizeOwnerMutation(actor) === "forbidden") {
      throw forbiddenIdentityError()
    }

    context.set("activeAdminSession", session)
    context.set("adminActor", actor)
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

export function ownerAdminRouteOptions(sessionResolver: AdminSessionResolver) {
  return {
    middleware: [createRequireOwnerAdminSessionMiddleware(sessionResolver)],
    security: [{ adminSessionCookie: [] }],
  }
}

export function unauthorizedIdentityError(): AppError {
  return new AppError({
    code: "UNAUTHORIZED",
    message: "Unauthorized",
    status: 401,
  })
}

export function forbiddenIdentityError(): AppError {
  return new AppError({
    code: "FORBIDDEN",
    message: "Forbidden",
    status: 403,
  })
}
