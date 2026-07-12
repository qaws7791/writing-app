import type { MiddlewareHandler } from "hono"
import { authorizeOwnerMutation } from "@workspace/core/admin"
import { withPrivateNoStore } from "@workspace/hono/security"

import type { AdminSessionResolver } from "@/auth/admin-session"
import type { AdminHonoEnv } from "@/context/hono-env"
import {
  forbiddenAdminError,
  mfaEnrollmentRequiredAdminError,
  stepUpRequiredAdminError,
  unauthorizedAdminError,
} from "@/errors/admin-errors"

export function createRequireAdminSessionMiddleware(
  sessionResolver: AdminSessionResolver,
  options: { readonly allowMfaEnrollment?: boolean } = {}
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
      authenticationAssurance: session.authenticationAssurance,
      id: session.admin.id,
      role: session.admin.role,
    })

    if (
      session.authenticationAssurance === "mfa-enrollment-required" &&
      options.allowMfaEnrollment !== true
    ) {
      throw mfaEnrollmentRequiredAdminError()
    }

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
      authenticationAssurance: session.authenticationAssurance,
      id: session.admin.id,
      role: session.admin.role,
    })

    switch (authorizeOwnerMutation(context.var.adminActor)) {
      case "allowed":
        break
      case "forbidden":
        throw forbiddenAdminError()
      case "mfa-enrollment-required":
        throw mfaEnrollmentRequiredAdminError()
      case "step-up-required":
        throw stepUpRequiredAdminError()
    }

    await next()
    context.res = withPrivateNoStore(context.res)
  }
}
