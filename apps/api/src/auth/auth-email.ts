import type { EmailSender } from "@workspace/email"

import type { ApiLogger } from "../observability/logger.js"

export type { EmailSender }

export type AuthEmailKind = "password-reset" | "verification"

export type AuthEmailMessage = {
  email: string
  kind: AuthEmailKind
  sentAt: string
  token: string
  url: string
}

export type DevEmailInbox = {
  clear: () => void
  readLatestMessage: (input: {
    email: string
    kind: AuthEmailKind
  }) => AuthEmailMessage | null
}

type DevEmailInboxWriter = DevEmailInbox & {
  store: (message: AuthEmailMessage) => void
}

function createKey(kind: AuthEmailKind, email: string): string {
  return `${kind}:${email.trim().toLowerCase()}`
}

function createLogMessage(
  message: Pick<AuthEmailMessage, "kind" | "url">,
  exposeSensitiveData: boolean
): string {
  if (!exposeSensitiveData) {
    return "auth email queued"
  }

  return `${message.kind} auth email queued: ${message.url}`
}

export function createDevEmailInbox(): DevEmailInboxWriter {
  const messages = new Map<string, AuthEmailMessage>()

  return {
    clear(): void {
      messages.clear()
    },

    readLatestMessage(input): AuthEmailMessage | null {
      return messages.get(createKey(input.kind, input.email)) ?? null
    },

    store(message: AuthEmailMessage): void {
      messages.set(createKey(message.kind, message.email), message)
    },
  }
}

export function createDevEmailPort(input: {
  exposeSensitiveData: boolean
  inbox: DevEmailInboxWriter
  logger: ApiLogger
}): EmailSender {
  function storeMessage(message: AuthEmailMessage): void {
    input.inbox.store(message)
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
      createLogMessage(message, input.exposeSensitiveData)
    )
  }

  return {
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
