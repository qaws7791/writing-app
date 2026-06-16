import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import type { AdminRole, AdminSessionResolver } from "@/auth/admin-session"
import type { KwepDatabase } from "@workspace/db/client"
import {
  adminAuthAccounts,
  adminAuthSessions,
  adminAuthUsers,
  adminAuthVerifications,
} from "@workspace/db/schema"
import * as dbSchema from "@workspace/db/schema"

export type CreateAdminAuthInput = {
  readonly authBaseUrl: string
  readonly cookieDomain?: string
  readonly db: KwepDatabase
  readonly googleClientId?: string
  readonly googleClientSecret?: string
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
        account: adminAuthAccounts,
        session: adminAuthSessions,
        user: adminAuthUsers,
        verification: adminAuthVerifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    secret: input.secret,
    socialProviders:
      input.googleClientId === undefined ||
      input.googleClientSecret === undefined
        ? {}
        : {
            google: {
              clientId: input.googleClientId,
              clientSecret: input.googleClientSecret,
              scope: ["openid", "email", "profile"],
            },
          },
    session: {
      modelName: "admin_session",
    },
    account: {
      modelName: "admin_account",
    },
    user: {
      additionalFields: {
        role: {
          defaultValue: "operator",
          input: false,
          required: false,
          type: ["owner", "operator"],
        },
      },
      modelName: "admin_user",
    },
    verification: {
      modelName: "admin_verification",
    },
    trustedOrigins: [input.webOrigin],
  })
}

type AdminBetterAuthSessionApi = {
  readonly api: {
    readonly getSession: (input: {
      readonly headers: Headers
    }) => Promise<AdminBetterAuthSession | null>
  }
}

type AdminBetterAuthSession = {
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

      if (session === null) {
        return null
      }

      const role = readAdminRole(session.user.role)

      return role === null
        ? null
        : {
            admin: {
              email: session.user.email,
              id: session.user.id,
              name: session.user.name,
              role,
            },
          }
    },
  }
}

function readAdminRole(role: unknown): AdminRole | null {
  return role === "owner" || role === "operator" ? role : null
}

function createAdminAdvancedOptions(cookieDomain: string | undefined) {
  const baseOptions = {
    cookiePrefix: "writing-app-admin",
    cookies: {
      session_token: {
        name: "admin_session_token",
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
