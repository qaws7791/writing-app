import { betterAuth } from "better-auth"
import {
  adminIdSchema,
  type AdminId,
} from "@workspace/contracts/identity/admin-ids"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"

import type { AuthDatabaseAdapter } from "#auth/shared/auth-database-adapter"
import { readAuthDatabaseAdapter } from "#auth/shared/auth-database-adapter"
import {
  readAuthRuntimeLoggerOption,
  type AuthRuntimeLogger,
} from "#auth/shared/auth-runtime-logger"

export type AdminAuthIdentity = Readonly<{
  email: string
  expiresAt: Date
  id: AdminId
  name: string
}>

export type AdminAuthIdentityResolver = Readonly<{
  resolveIdentity: (headers: Headers) => Promise<AdminAuthIdentity | null>
}>

export type AdminSessionRevoker = {
  readonly revokeAllForAdmin: (_adminId: AdminId) => Promise<void> | void
}

export type CreateAdminAuthRuntimeInput = {
  readonly database: AuthDatabaseAdapter
  readonly logger?: AuthRuntimeLogger
  readonly secret: string
  readonly sessionRevoker: AdminSessionRevoker
  readonly webOrigin: string
}

export type AdminAuthRuntime = {
  readonly authHandler: (request: Request) => Promise<Response>
  readonly identityResolver: AdminAuthIdentityResolver
}

export function createAdminAuthRuntime(
  input: CreateAdminAuthRuntimeInput
): AdminAuthRuntime {
  const auth = betterAuth({
    account: { modelName: "admin_account" },
    advanced: {
      cookiePrefix: "writing-app-admin",
      cookies: {
        session_token: {
          name: adminSessionCookieName,
        },
      },
    },
    basePath: "/api/admin/auth",
    baseURL: input.webOrigin,
    database: readAuthDatabaseAdapter(input.database),
    logger: readAuthRuntimeLoggerOption(input.logger),
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
      modelName: "admin_user",
    },
    verification: { modelName: "admin_verification" },
  })
  const identityResolver = createAdminIdentityResolver(auth)

  return {
    authHandler: createAdminAuthHandler({
      auth,
      identityResolver,
      sessionRevoker: input.sessionRevoker,
    }),
    identityResolver,
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
  }
}

function createAdminIdentityResolver(
  auth: AdminBetterAuthSessionApi
): AdminAuthIdentityResolver {
  return {
    async resolveIdentity(headers) {
      const session = await auth.api.getSession({ headers })
      if (session === null) return null

      const adminId = adminIdSchema.safeParse(session.user.id)

      return !adminId.success
        ? null
        : {
            email: session.user.email,
            expiresAt: session.session.expiresAt,
            id: adminId.data,
            name: session.user.name,
          }
    },
  }
}

function createAdminAuthHandler(input: {
  readonly auth: { readonly handler: (request: Request) => Promise<Response> }
  readonly identityResolver: AdminAuthIdentityResolver
  readonly sessionRevoker: AdminSessionRevoker
}): (request: Request) => Promise<Response> {
  return async (request) => {
    if (!isPasswordChangeRequest(request)) {
      return input.auth.handler(request)
    }

    const identity = await input.identityResolver.resolveIdentity(
      request.headers
    )
    const response = await input.auth.handler(request)
    if (!response.ok || identity === null) return response

    await input.sessionRevoker.revokeAllForAdmin(identity.id)

    const headers = new Headers(response.headers)
    headers.append("Set-Cookie", createExpiredAdminSessionCookie(request.url))

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

function createExpiredAdminSessionCookie(requestUrl: string): string {
  const attributes = [
    `${adminSessionCookieName}=`,
    "Max-Age=0",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ]

  if (new URL(requestUrl).protocol === "https:") attributes.push("Secure")

  return attributes.join("; ")
}
