import type { Context, MiddlewareHandler, Next } from "hono"

export interface AdminAuthUser {
  email: string
  id: string
  image: string | null
  name: string
}

export interface AdminSession {
  id: string
}

export interface CurrentAdminSession {
  session: AdminSession
  user: AdminAuthUser
}

export interface AdminAuthRuntime {
  getSession(headers: Headers): Promise<CurrentAdminSession | null>
  handler(request: Request): Promise<Response>
}

export type AdminSessionVariables = {
  adminSession: CurrentAdminSession
}

export const adminUnauthorizedError = {
  code: "unauthorized",
  message: "Admin authentication is required.",
} as const

export function requireAdminSession(
  auth: AdminAuthRuntime
): MiddlewareHandler<{ Variables: AdminSessionVariables }> {
  return async (
    context: Context<{ Variables: AdminSessionVariables }>,
    next: Next
  ) => {
    const session = await auth.getSession(context.req.raw.headers)

    if (!session) {
      return context.json(adminUnauthorizedError, 401)
    }

    context.set("adminSession", session)
    await next()
  }
}
