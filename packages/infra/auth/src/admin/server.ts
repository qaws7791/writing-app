import { betterAuth } from "better-auth"
import {
  adminIdSchema,
  type AdminId,
} from "@workspace/contracts/identity/admin-ids"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import {
  adminRoles,
  adminRoleValues,
  parseAdminRole,
  type AdminRole,
} from "@workspace/core/admin"

import type { AuthDatabaseAdapter } from "#auth/shared/auth-database-adapter"
import { readAuthDatabaseAdapter } from "#auth/shared/auth-database-adapter"

export const adminSessionExpiresAt = Symbol("admin-session-expires-at")

export type AdminAuthenticatedSession = {
  readonly admin: {
    readonly email: string
    readonly id: AdminId
    readonly name: string
    readonly role: AdminRole
  }
  readonly [adminSessionExpiresAt]: Date
}

export type AdminSessionResolver = {
  readonly resolveSession: (
    headers: Headers
  ) => Promise<AdminAuthenticatedSession | null>
}

export type AdminSessionRevoker = {
  readonly revokeAllForAdmin: (_adminId: AdminId) => Promise<void> | void
}

export type CreateAdminAuthRuntimeInput = {
  readonly apiOrigin: string
  readonly cookieDomain?: string
  readonly database: AuthDatabaseAdapter
  readonly secret: string
  readonly sessionRevoker: AdminSessionRevoker
  readonly webOrigin: string
}

export type AdminAuthRuntime = {
  readonly authHandler: (request: Request) => Promise<Response>
  readonly sessionResolver: AdminSessionResolver
}

export function createAdminAuthRuntime(
  input: CreateAdminAuthRuntimeInput
): AdminAuthRuntime {
  const auth = betterAuth({
    account: { modelName: "admin_account" },
    advanced: createAdminAdvancedOptions(input.cookieDomain),
    basePath: "/api/admin/auth",
    baseURL: input.apiOrigin,
    database: readAuthDatabaseAdapter(input.database),
    disabledPaths: ["/sign-up/email"],
    emailAndPassword: {
      disableSignUp: true,
      enabled: true,
    },
    rateLimit: { storage: "database" },
    secret: input.secret,
    session: { modelName: "admin_session" },
    trustedOrigins: [input.webOrigin],
    user: {
      additionalFields: {
        role: {
          defaultValue: adminRoles.operator,
          input: false,
          required: false,
          type: [...adminRoleValues],
        },
      },
      modelName: "admin_user",
    },
    verification: { modelName: "admin_verification" },
  })
  const sessionResolver = createAdminSessionResolver(auth)

  return {
    authHandler: createAdminAuthHandler({
      auth,
      cookieDomain: input.cookieDomain,
      sessionResolver,
      sessionRevoker: input.sessionRevoker,
    }),
    sessionResolver,
  }
}

type AdminBetterAuthSessionApi = {
  readonly api: {
    readonly getSession: (input: {
      readonly headers: Headers
    }) => Promise<AdminBetterAuthSession | null>
  }
}

type AdminBetterAuthSession = {
  readonly session: {
    readonly expiresAt: Date
  }
  readonly user: {
    readonly email: string
    readonly id: string
    readonly name: string
    readonly role?: unknown
  }
}

function createAdminSessionResolver(
  auth: AdminBetterAuthSessionApi
): AdminSessionResolver {
  return {
    async resolveSession(headers) {
      const session = await auth.api.getSession({ headers })
      if (session === null) return null

      const role = parseAdminRole(session.user.role)
      const adminId = adminIdSchema.safeParse(session.user.id)

      return role === null || !adminId.success
        ? null
        : {
            admin: {
              email: session.user.email,
              id: adminId.data,
              name: session.user.name,
              role,
            },
            [adminSessionExpiresAt]: session.session.expiresAt,
          }
    },
  }
}

function createAdminAuthHandler(input: {
  readonly auth: { readonly handler: (request: Request) => Promise<Response> }
  readonly cookieDomain?: string
  readonly sessionResolver: AdminSessionResolver
  readonly sessionRevoker: AdminSessionRevoker
}): (request: Request) => Promise<Response> {
  return async (request) => {
    if (!isPasswordChangeRequest(request)) {
      return input.auth.handler(request)
    }

    const session = await input.sessionResolver.resolveSession(request.headers)
    const response = await input.auth.handler(request)
    if (!response.ok || session === null) return response

    await input.sessionRevoker.revokeAllForAdmin(session.admin.id)

    const headers = new Headers(response.headers)
    headers.append(
      "Set-Cookie",
      createExpiredAdminSessionCookie(input.cookieDomain, request.url)
    )

    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    })
  }
}

function isPasswordChangeRequest(request: Request): boolean {
  return (
    request.method === "POST" &&
    new URL(request.url).pathname === "/api/admin/auth/change-password"
  )
}

function createExpiredAdminSessionCookie(
  cookieDomain: string | undefined,
  requestUrl: string
): string {
  const attributes = [
    `${adminSessionCookieName}=`,
    "Max-Age=0",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ]

  if (cookieDomain !== undefined) attributes.push(`Domain=${cookieDomain}`)
  if (new URL(requestUrl).protocol === "https:") attributes.push("Secure")

  return attributes.join("; ")
}

function createAdminAdvancedOptions(cookieDomain: string | undefined) {
  const baseOptions = {
    cookiePrefix: "writing-app-admin",
    cookies: {
      session_token: {
        name: adminSessionCookieName,
      },
    },
  }

  if (cookieDomain === undefined) return baseOptions

  return {
    ...baseOptions,
    crossSubDomainCookies: {
      domain: cookieDomain,
      enabled: true,
    },
  }
}
