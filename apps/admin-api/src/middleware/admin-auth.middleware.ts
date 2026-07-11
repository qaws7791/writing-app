import type { MiddlewareHandler } from "hono"
import { canAccessOwnerAdminRoute } from "@workspace/core/admin"

import type { AdminSessionResolver } from "@/auth/admin-session"
import type { AdminHonoEnv } from "@/context/hono-env"
import {
  forbiddenAdminError,
  unauthorizedAdminError,
} from "@/errors/admin-errors"

export function createRequireAdminSessionMiddleware(
  sessionResolver: AdminSessionResolver
): MiddlewareHandler<AdminHonoEnv> {
  return async (context, next) => {
    const session = await sessionResolver.resolveSession(
      context.req.raw.headers
    )

    if (session === null) {
      throw unauthorizedAdminError()
    }

    context.set("activeAdminSession", session)

    await next()
  }
}

export function createRequireOwnerAdminSessionMiddleware(
  sessionResolver: AdminSessionResolver
): MiddlewareHandler<AdminHonoEnv> {
  return async (context, next) => {
    const session = await sessionResolver.resolveSession(
      context.req.raw.headers
    )

    if (session === null) {
      throw unauthorizedAdminError()
    }

    context.set("activeAdminSession", session)

    if (!canAccessOwnerAdminRoute(session.admin.role)) {
      throw forbiddenAdminError()
    }

    await next()
  }
}
