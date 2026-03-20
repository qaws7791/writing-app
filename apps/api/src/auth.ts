import type { Database } from "bun:sqlite"
import { betterAuth } from "better-auth"
import { getMigrations } from "better-auth/db/migration"

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
  database: Database,
  environment: AuthEnvironment,
  emailPort: AuthEmailPort
) {
  const trustedOrigins = Array.from(
    new Set([...defaultTrustedOrigins, environment.webBaseUrl])
  )

  return betterAuth({
    baseURL: `${environment.authBaseUrl}/api/auth`,
    database,
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

export async function ensureAuthTables(auth: WritingAppAuth): Promise<void> {
  const migrations = await getMigrations(auth.options)
  await migrations.runMigrations()
}
