import { betterAuth } from "better-auth"
import { createAuthMiddleware } from "better-auth/api"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { authSchema, type DbClient } from "@workspace/database"

import { assertEmailSignUpAllowed } from "./auth-sign-up-guard.js"
import type { AuthEmailPort } from "./auth-email.js"

const defaultTrustedOrigins = [
  "http://127.0.0.1:3000",
  "http://localhost:3000",
] as const

export type AuthEnvironment = {
  authBaseUrl: string
  authSecret: string
  webBaseUrl: string
}

export function createAuth(
  database: DbClient,
  environment: AuthEnvironment,
  emailPort: AuthEmailPort
) {
  const trustedOrigins = Array.from(
    new Set([...defaultTrustedOrigins, environment.webBaseUrl])
  )

  return betterAuth({
    baseURL: `${environment.authBaseUrl}/api/auth`,
    database: drizzleAdapter(database, {
      provider: "sqlite",
      schema: authSchema,
    }),
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") {
          return
        }

        const email =
          typeof ctx.body?.email === "string"
            ? ctx.body.email.trim().toLowerCase()
            : ""

        if (!email) {
          return
        }

        await assertEmailSignUpAllowed({
          email,
          findExistingUserByEmail: (nextEmail) =>
            database.query.user.findFirst({
              where: (fields, { eq }) => eq(fields.email, nextEmail),
            }),
        })
      }),
    },
    emailAndPassword: {
      autoSignIn: false,
      enabled: true,
      maxPasswordLength: 128,
      minPasswordLength: 8,
      requireEmailVerification: true,
      sendResetPassword: async ({ token, url, user }) => {
        await emailPort.sendPasswordResetEmail({
          email: user.email,
          token,
          url,
        })
      },
    },
    emailVerification: {
      autoSignInAfterVerification: false,
      sendOnSignUp: true,
      sendVerificationEmail: async ({ token, url, user }) => {
        await emailPort.sendVerificationEmail({
          email: user.email,
          token,
          url,
        })
      },
    },
    secret: environment.authSecret,
    trustedOrigins,
  })
}

export type WritingAppAuth = ReturnType<typeof createAuth>
export type WritingAppSession = NonNullable<
  Awaited<ReturnType<WritingAppAuth["api"]["getSession"]>>
>
