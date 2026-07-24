import { betterAuth } from "better-auth"
import { learnerSessionCookieName } from "@workspace/contracts/auth-session-cookie"

import type { AuthEmailDeliveryPort } from "#auth/email/delivery"
import type { AuthDatabaseAdapter } from "#auth/shared/auth-database-adapter"
import { readAuthDatabaseAdapter } from "#auth/shared/auth-database-adapter"

export type CreateLearnerAuthRuntimeInput = {
  readonly database: AuthDatabaseAdapter
  readonly emailDelivery: AuthEmailDeliveryPort
  readonly googleClientId?: string
  readonly googleClientSecret?: string
  readonly identityProvisioner: LearnerIdentityProvisioner
  readonly secret: string
  readonly webOrigin: string
}

export type LearnerAuthRuntime = {
  readonly authHandler: (request: Request) => Promise<Response>
  readonly identityResolver: LearnerAuthIdentityResolver
}

export type LearnerAuthIdentity = Readonly<{
  email: string
  id: string
  image: string | null
  joinedAt: Date
  name: string
}>

export type LearnerAuthIdentityResolver = Readonly<{
  resolveIdentity: (headers: Headers) => Promise<LearnerAuthIdentity | null>
}>

export type LearnerIdentityProvisioner = Readonly<{
  provision: (identity: LearnerAuthIdentity) => Promise<void>
}>

export function createLearnerAuthRuntime(
  input: CreateLearnerAuthRuntimeInput
): LearnerAuthRuntime {
  const auth = betterAuth({
    account: {
      accountLinking: {
        allowDifferentEmails: false,
        disableImplicitLinking: false,
        enabled: true,
        requireLocalEmailVerified: true,
        updateUserInfoOnLink: false,
      },
    },
    advanced: {
      cookies: {
        session_token: {
          name: learnerSessionCookieName,
        },
      },
      ipAddress: {
        ipAddressHeaders: ["x-writing-app-client-ip"],
      },
    },
    basePath: "/api/auth",
    baseURL: input.webOrigin,
    database: readAuthDatabaseAdapter(input.database),
    databaseHooks: createLearnerAuthHooks({
      identityProvisioner: input.identityProvisioner,
    }),
    emailAndPassword: {
      enabled: true,
      maxPasswordLength: 128,
      minPasswordLength: 12,
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      async sendResetPassword({ url, user }) {
        try {
          await input.emailDelivery.deliverPasswordReset({
            callbackUrl: url,
            recipient: {
              email: user.email,
              name: user.name,
            },
          })
        } catch {
          // 비밀번호 재설정 응답은 메일 전달 결과와 무관하게 동일해야 한다.
        }
      },
    },
    emailVerification: {
      autoSignInAfterVerification: false,
      sendOnSignIn: false,
      sendOnSignUp: true,
      async sendVerificationEmail({ url, user }) {
        await input.emailDelivery.deliverVerification({
          callbackUrl: url,
          recipient: {
            email: user.email,
            name: user.name,
          },
        })
      },
    },
    rateLimit: {
      customRules: {
        "/send-verification-email": {
          max: 3,
          window: 60,
        },
      },
      enabled: true,
      storage: "memory",
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
              mapProfileToUser: (profile) => ({
                emailVerified: profile.email_verified,
                image: profile.picture,
                name: profile.name,
              }),
              scope: ["openid", "email", "profile"],
            },
          },
    trustedOrigins: [input.webOrigin],
  })

  return {
    authHandler: createSizeLimitedAuthHandler(auth.handler),
    identityResolver: createLearnerIdentityResolver(auth),
  }
}

const learnerAuthRequestBodyLimitBytes = 16 * 1024

function createSizeLimitedAuthHandler(
  authHandler: (request: Request) => Promise<Response>
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (
      request.method !== "POST" ||
      !(await exceedsRequestBodyLimit(
        request,
        learnerAuthRequestBodyLimitBytes
      ))
    ) {
      return authHandler(request)
    }

    return Response.json(
      {
        code: "PAYLOAD_TOO_LARGE",
        message: "Authentication request body is too large",
      },
      { status: 413 }
    )
  }
}

async function exceedsRequestBodyLimit(
  request: Request,
  limitBytes: number
): Promise<boolean> {
  const contentLength = request.headers.get("content-length")
  if (
    contentLength !== null &&
    Number.isFinite(Number(contentLength)) &&
    Number(contentLength) > limitBytes
  ) {
    return true
  }

  if (request.body === null) return false

  const reader = request.clone().body?.getReader()
  if (reader === undefined) return false

  let receivedBytes = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) return false
      receivedBytes += chunk.value.byteLength
      if (receivedBytes > limitBytes) {
        await reader.cancel()
        return true
      }
    }
  } finally {
    reader.releaseLock()
  }
}

type LearnerBetterAuthSessionApi = {
  readonly api: {
    readonly getSession: (input: {
      readonly headers: Headers
    }) => Promise<LearnerBetterAuthSession | null>
  }
}

type LearnerBetterAuthSession = {
  readonly user: {
    readonly createdAt: Date | string
    readonly email: string
    readonly emailVerified: boolean
    readonly id: string
    readonly image?: string | null
    readonly name: string
  }
}

function createLearnerIdentityResolver(
  auth: LearnerBetterAuthSessionApi
): LearnerAuthIdentityResolver {
  return {
    async resolveIdentity(headers) {
      const session = await auth.api.getSession({ headers })
      return session === null || !session.user.emailVerified
        ? null
        : toLearnerAuthIdentity(session.user)
    },
  }
}

function createLearnerAuthHooks({
  identityProvisioner,
}: {
  readonly identityProvisioner: LearnerIdentityProvisioner
}) {
  return {
    user: {
      create: {
        after: async (user: SessionUserRow) => {
          await identityProvisioner.provision(toLearnerAuthIdentity(user))
        },
      },
    },
  }
}

type SessionUserRow = {
  readonly createdAt: Date | string
  readonly email: string
  readonly emailVerified: boolean
  readonly id: string
  readonly image?: string | null
  readonly name: string
}

function toLearnerAuthIdentity(user: SessionUserRow): LearnerAuthIdentity {
  return {
    email: user.email,
    id: user.id,
    image: user.image ?? null,
    joinedAt: new Date(user.createdAt),
    name: user.name,
  }
}
