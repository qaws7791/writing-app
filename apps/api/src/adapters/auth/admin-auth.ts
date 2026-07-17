import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import { adminIdSchema, type AdminId } from "@workspace/contracts/admin"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import {
  adminRoles,
  adminRoleValues,
  parseAdminRole,
} from "@workspace/core/admin"
import type { WritingAppDatabase } from "@workspace/db"
import {
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthUsers,
  adminAuthVerifications,
} from "@workspace/db/schema"
import * as dbSchema from "@workspace/db/schema"

import {
  adminSessionExpiresAt,
  type AdminSessionResolver,
} from "@/adapters/auth/admin-session"

export type CreateAdminAuthInput = {
  readonly authBaseUrl: string
  readonly cookieDomain?: string
  readonly db: WritingAppDatabase
  readonly secret: string
  readonly webOrigin: string
}

export type AdminSessionRevoker = {
  readonly revokeAllForAdmin: (_adminId: AdminId) => Promise<void> | void
}

export function createAdminAuth(input: CreateAdminAuthInput) {
  return betterAuth({
    advanced: createAdminAdvancedOptions(input.cookieDomain),
    baseURL: input.authBaseUrl,
    database: drizzleAdapter(input.db, {
      provider: "sqlite",
      schema: {
        ...dbSchema,
        admin_account: adminAuthAccounts,
        admin_session: adminAuthSessions,
        admin_user: adminAuthUsers,
        admin_verification: adminAuthVerifications,
      },
    }),
    disabledPaths: ["/sign-up/email"],
    emailAndPassword: {
      disableSignUp: true,
      enabled: true,
    },
    secret: input.secret,
    session: { modelName: "admin_session" },
    account: { modelName: "admin_account" },
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
    trustedOrigins: [input.webOrigin],
  })
}

export function createAdminAuthHandler(input: {
  readonly auth: ReturnType<typeof createAdminAuth>
  readonly cookieDomain?: string
  readonly sessionRevoker: AdminSessionRevoker
}): (request: Request) => Promise<Response> {
  const sessionResolver = createAdminSessionResolver(input.auth)

  return async (request) => {
    if (!isPasswordChangeRequest(request)) {
      return input.auth.handler(request)
    }

    const session = await sessionResolver.resolveSession(request.headers)
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

export function createAdminSessionRevoker(
  database: WritingAppDatabase
): AdminSessionRevoker {
  return {
    revokeAllForAdmin(adminId) {
      database
        .delete(adminAuthSessions)
        .where(eq(adminAuthSessions.userId, adminId))
        .run()
    },
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

export function createAdminSessionResolver(
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

function isPasswordChangeRequest(request: Request): boolean {
  return (
    request.method === "POST" &&
    new URL(request.url).pathname === "/api/auth/change-password"
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
