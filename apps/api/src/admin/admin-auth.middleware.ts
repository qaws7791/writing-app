import type { MiddlewareHandler } from "hono"
import { authorizeOwnerMutation } from "@workspace/core/admin"
import { withPrivateNoStore } from "@/http/platform/security"

import type { AdminSessionResolver } from "@/adapters/auth/admin-session"
import {
  forbiddenAdminError,
  unauthorizedAdminError,
} from "@/admin/admin-errors"
import type { AdminHonoEnv } from "@/admin/admin-hono-env"

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
    context.set("adminActor", {
      id: session.admin.id,
      role: session.admin.role,
    })

    await next()
    context.res = withPrivateNoStore(context.res)
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
    context.set("adminActor", {
      id: session.admin.id,
      role: session.admin.role,
    })

    switch (authorizeOwnerMutation(context.var.adminActor)) {
      case "allowed":
        break
      case "forbidden":
        throw forbiddenAdminError()
    }

    await next()
    context.res = withPrivateNoStore(context.res)
  }
}
