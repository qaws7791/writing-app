import type { AdminSessionResolver } from "@workspace/auth/admin/server"
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
