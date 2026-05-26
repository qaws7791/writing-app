import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import type { WritingAppDatabase } from "@workspace/db"

import type { AuthRuntime } from "@/auth/session"

interface CreateAuthRuntimeInput {
  baseUrl: string
  db: WritingAppDatabase
  googleClientId: string
  googleClientSecret: string
  secret: string
}

export function createAuthRuntime(input: CreateAuthRuntimeInput): AuthRuntime {
  const auth = betterAuth({
    baseURL: input.baseUrl,
    database: drizzleAdapter(input.db, {
      provider: "sqlite",
    }),
    emailAndPassword: {
      enabled: true,
    },
    secret: input.secret,
    socialProviders: {
      google: {
        clientId: input.googleClientId,
        clientSecret: input.googleClientSecret,
      },
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
