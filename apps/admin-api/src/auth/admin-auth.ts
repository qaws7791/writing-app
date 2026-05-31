import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import {
  adminAccount,
  adminSession,
  adminUser,
  adminVerification,
} from "@workspace/db/schema"
import type { WritingAppDatabase } from "@workspace/db/client"

import type { AdminAuthRuntime } from "@/auth/admin-session"

interface CreateAdminAuthRuntimeInput {
  baseUrl: string
  cookieDomain?: string
  db: WritingAppDatabase
  secret: string
  trustedOrigins?: string[]
}

export function createAdminAuthRuntime(
  input: CreateAdminAuthRuntimeInput
): AdminAuthRuntime {
  const auth = betterAuth({
    account: {
      modelName: "adminAccount",
    },
    advanced: getAdvancedAdminAuthOptions(input.cookieDomain),
    baseURL: input.baseUrl,
    database: drizzleAdapter(input.db, {
      provider: "sqlite",
      schema: {
        adminAccount,
        adminSession,
        adminUser,
        adminVerification,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    secret: input.secret,
    session: {
      modelName: "adminSession",
    },
    trustedOrigins: input.trustedOrigins,
    user: {
      modelName: "adminUser",
    },
    verification: {
      modelName: "adminVerification",
    },
  })

  return {
    async getSession(headers) {
      const session = await auth.api.getSession({ headers })

      if (!session) {
        return null
      }

      return {
        session: {
          id: session.session.id,
        },
        user: {
          email: session.user.email,
          id: session.user.id,
          image: session.user.image ?? null,
          name: session.user.name,
        },
      }
    },
    handler: auth.handler,
  }
}

function getAdvancedAdminAuthOptions(cookieDomain: string | undefined) {
  const baseOptions = {
    cookiePrefix: "writing-app-admin",
  }

  if (!cookieDomain) {
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
