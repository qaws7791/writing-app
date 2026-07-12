import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { twoFactor } from "better-auth/plugins"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"

import {
  adminSessionExpiresAt,
  type AdminSessionResolver,
} from "@/auth/admin-session"
import {
  adminRoles,
  adminRoleValues,
  parseAdminRole,
} from "@workspace/core/admin"
import type {
  WritingAppDatabase,
  WritingAppDatabaseClient,
} from "@workspace/db/client"
import {
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthTwoFactors,
  adminAuthUsers,
  adminAuthVerifications,
} from "@workspace/db/schema"
import * as dbSchema from "@workspace/db/schema"

export type CreateAdminAuthInput = {
  readonly authBaseUrl: string
  readonly cookieDomain?: string
  readonly db: WritingAppDatabase
  readonly secret: string
  readonly webOrigin: string
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
        admin_two_factor: adminAuthTwoFactors,
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
    session: {
      freshAge: adminMfaStepUpMaxAgeSeconds,
      modelName: "admin_session",
    },
    account: {
      modelName: "admin_account",
    },
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
    verification: {
      modelName: "admin_verification",
    },
    plugins: [
      twoFactor({
        accountLockout: {
          durationSeconds: 15 * 60,
          maxFailedAttempts: 5,
        },
        backupCodeOptions: {
          amount: 0,
        },
        issuer: "글결 어드민",
        trustDeviceMaxAge: 0,
        twoFactorCookieMaxAge: adminMfaStepUpMaxAgeSeconds,
        twoFactorTable: "admin_two_factor",
      }),
    ],
    trustedOrigins: [input.webOrigin],
  })
}

export function createAdminAuthHandler({
  auth,
  cookieDomain,
  database,
}: {
  readonly auth: ReturnType<typeof createAdminAuth>
  readonly cookieDomain?: string
  readonly database: WritingAppDatabaseClient
}) {
  const sessionResolver = createAdminSessionResolver(auth)

  return async (request: Request): Promise<Response> => {
    if (!isPasswordChangeRequest(request)) return auth.handler(request)

    const session = await sessionResolver.resolveSession(request.headers)
    const response = await auth.handler(request)
    if (!response.ok || session === null) return response

    database.sqlite
      .query("DELETE FROM admin_session WHERE user_id = ?")
      .run(session.admin.id)

    const headers = new Headers(response.headers)
    headers.append(
      "Set-Cookie",
      createExpiredAdminSessionCookie(cookieDomain, request.url)
    )
    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    })
  }
}

type AdminBetterAuthSessionApi = {
  readonly api: {
    readonly getSession: (_input: {
      readonly headers: Headers
    }) => Promise<AdminBetterAuthSession | null>
  }
}

type AdminBetterAuthSession = {
  readonly session: {
    readonly createdAt: Date
    readonly expiresAt: Date
  }
  readonly user: {
    readonly email: string
    readonly id: string
    readonly name: string
    readonly role?: unknown
    readonly twoFactorEnabled?: unknown
  }
}

export function createAdminSessionResolver(
  auth: AdminBetterAuthSessionApi,
  options: { readonly now?: () => Date } = {}
): AdminSessionResolver {
  const now = options.now ?? (() => new Date())

  return {
    async resolveSession(headers) {
      const session = await auth.api.getSession({ headers })

      if (session === null) {
        return null
      }

      const role = parseAdminRole(session.user.role)

      return role === null
        ? null
        : {
            admin: {
              email: session.user.email,
              id: session.user.id,
              name: session.user.name,
              role,
              twoFactorEnabled: session.user.twoFactorEnabled === true,
            },
            authenticationAssurance: resolveAuthenticationAssurance({
              createdAt: session.session.createdAt,
              now: now(),
              role,
              twoFactorEnabled: session.user.twoFactorEnabled === true,
            }),
            [adminSessionExpiresAt]: session.session.expiresAt,
          }
    },
  }
}

export const adminMfaStepUpMaxAgeSeconds = 10 * 60

function resolveAuthenticationAssurance({
  createdAt,
  now,
  role,
  twoFactorEnabled,
}: {
  readonly createdAt: Date
  readonly now: Date
  readonly role: ReturnType<typeof parseAdminRole> & string
  readonly twoFactorEnabled: boolean
}) {
  if (role !== adminRoles.owner) return "password" as const
  if (!twoFactorEnabled) return "mfa-enrollment-required" as const

  const stepUpExpiresAt =
    createdAt.getTime() + adminMfaStepUpMaxAgeSeconds * 1_000

  return stepUpExpiresAt > now.getTime()
    ? ("mfa-step-up-verified" as const)
    : ("mfa-step-up-required" as const)
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

  if (cookieDomain === undefined) {
    return baseOptions
  }

  return {
    ...baseOptions,
    crossSubDomainCookies: {
      domain: cookieDomain,
      enabled: true,
    },
  }
}
