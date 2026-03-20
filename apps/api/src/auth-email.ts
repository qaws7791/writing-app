import type { ApiLogger } from "./logger.js"

type AuthEmailKind = "password-reset" | "verification"

export type AuthEmailMessage = {
  email: string
  kind: AuthEmailKind
  sentAt: string
  token: string
  url: string
}

export type AuthEmailPort = {
  clear: () => void
  readLatestMessage: (input: {
    email: string
    kind: AuthEmailKind
  }) => AuthEmailMessage | null
  sendPasswordResetEmail: (input: {
    email: string
    token: string
    url: string
  }) => Promise<void>
  sendVerificationEmail: (input: {
    email: string
    token: string
    url: string
  }) => Promise<void>
}

function createKey(kind: AuthEmailKind, email: string): string {
  return `${kind}:${email.trim().toLowerCase()}`
}

export function createAuthEmailPort(input: {
  exposeSensitiveData: boolean
  logger: ApiLogger
}): AuthEmailPort {
  const latestMessages = new Map<string, AuthEmailMessage>()

  function storeMessage(message: AuthEmailMessage): void {
    latestMessages.set(createKey(message.kind, message.email), message)
    input.logger.info(
      input.exposeSensitiveData
        ? {
            email: message.email,
            kind: message.kind,
            token: message.token,
            url: message.url,
          }
        : {
            email: message.email,
            kind: message.kind,
          },
      "auth email queued"
    )
  }

  return {
    clear() {
      latestMessages.clear()
    },

    readLatestMessage(input) {
      return latestMessages.get(createKey(input.kind, input.email)) ?? null
    },

    async sendPasswordResetEmail(input) {
      storeMessage({
        email: input.email,
        kind: "password-reset",
        sentAt: new Date().toISOString(),
        token: input.token,
        url: input.url,
      })
    },

    async sendVerificationEmail(input) {
      storeMessage({
        email: input.email,
        kind: "verification",
        sentAt: new Date().toISOString(),
        token: input.token,
        url: input.url,
      })
    },
  }
}
