import type { AdminSessionResolver } from "@/auth/admin-session"
import {
  createRequireAdminSessionMiddleware,
  createRequireOwnerAdminSessionMiddleware,
} from "@/middleware/admin-auth.middleware"

export function adminSessionRouteOptions(
  sessionResolver: AdminSessionResolver
) {
  return {
    middleware: [createRequireAdminSessionMiddleware(sessionResolver)],
    security: [{ adminSessionCookie: [] }],
  }
}

export function adminMfaEnrollmentSessionRouteOptions(
  sessionResolver: AdminSessionResolver
) {
  return {
    middleware: [
      createRequireAdminSessionMiddleware(sessionResolver, {
        allowMfaEnrollment: true,
      }),
    ],
    security: [{ adminSessionCookie: [] }],
  }
}

export function ownerAdminRouteOptions(sessionResolver: AdminSessionResolver) {
  return {
    middleware: [createRequireOwnerAdminSessionMiddleware(sessionResolver)],
    security: [{ adminSessionCookie: [] }],
  }
}
