import { betterAuth } from "better-auth"
import { createAuthMiddleware } from "better-auth/api"

import { assertEmailSignUpAllowed } from "./auth-sign-up-guard.js"
import type { EmailSender } from "./auth-email.js"

type BetterAuthDatabase = NonNullable<
  Parameters<typeof betterAuth>[0]["database"]
>

export type AuthUserPort = {
  findUserByEmail: (
    email: string
  ) => PromiseLike<{ email: string } | null | undefined>
}

export type AuthEnvironment = {
  authBaseUrl: string
  authSecret: string
  webBaseUrl: string
}

export function createAuth(
  databaseAdapter: BetterAuthDatabase,
  userPort: AuthUserPort,
  environment: AuthEnvironment,
  emailSender: EmailSender
) {
  const trustedOrigins = [environment.webBaseUrl]

  return betterAuth({
    baseURL: `${environment.authBaseUrl}/api/auth`,
    database: databaseAdapter,
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
          findExistingUserByEmail: userPort.findUserByEmail,
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
        await emailSender.sendPasswordResetEmail({
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
        await emailSender.sendVerificationEmail({
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
