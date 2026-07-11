import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import type { AdminSessionResolver } from "@/auth/admin-session"
import {
  adminRoles,
  adminRoleValues,
  parseAdminRole,
} from "@workspace/core/admin"
import type { WritingAppDatabase } from "@workspace/db/client"
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

      const role = parseAdminRole(session.user.role)

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
