import type { AdminSessionResolver } from "@/adapters/auth/admin-session"
import {
  createRequireAdminSessionMiddleware,
  createRequireOwnerAdminSessionMiddleware,
} from "@/admin/admin-auth.middleware"

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
