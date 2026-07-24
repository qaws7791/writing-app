import {
  AuthEmailDeliveryError,
  isAuthEmailDeliveryError,
  type AuthEmailDeliveryInput,
  type AuthEmailDeliveryPort,
} from "#auth/email/delivery"
import {
  createPasswordResetEmailMessage,
  createVerificationEmailMessage,
  type AuthEmailMessage,
} from "#auth/email/templates"

const resendEmailEndpoint = "https://api.resend.com/emails"
const defaultTimeoutMilliseconds = 5_000

export type CreateResendAuthEmailDeliveryInput = Readonly<{
  apiKey: string
  fetch?: AuthEmailFetch
  from: string
  replyTo?: string
  timeoutMilliseconds?: number
}>

export type AuthEmailFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export function createResendAuthEmailDelivery(
  input: CreateResendAuthEmailDeliveryInput
): AuthEmailDeliveryPort {
  const configuration = readConfiguration(input)

  return {
    async deliverPasswordReset(deliveryInput) {
      await deliver({
        configuration,
        deliveryInput,
        message: createPasswordResetEmailMessage(deliveryInput),
      })
    },
    async deliverVerification(deliveryInput) {
      await deliver({
        configuration,
        deliveryInput,
        message: createVerificationEmailMessage(deliveryInput),
      })
    },
  }
}

type ResendConfiguration = Readonly<{
  apiKey: string
  fetch: AuthEmailFetch
  from: string
  replyTo: string | undefined
  timeoutMilliseconds: number
}>

function readConfiguration(
  input: CreateResendAuthEmailDeliveryInput
): ResendConfiguration {
  const apiKey = input.apiKey.trim()
  const from = input.from.trim()
  const replyTo = input.replyTo?.trim()
  const timeoutMilliseconds =
    input.timeoutMilliseconds ?? defaultTimeoutMilliseconds

  if (
    apiKey === "" ||
    from === "" ||
    replyTo === "" ||
    !Number.isSafeInteger(timeoutMilliseconds) ||
    timeoutMilliseconds <= 0
  ) {
    throw new AuthEmailDeliveryError("configuration-invalid")
  }

  return {
    apiKey,
    fetch: input.fetch ?? globalThis.fetch.bind(globalThis),
    from,
    replyTo,
    timeoutMilliseconds,
  }
}

async function deliver(input: {
  readonly configuration: ResendConfiguration
  readonly deliveryInput: AuthEmailDeliveryInput
  readonly message: AuthEmailMessage
}): Promise<void> {
  const abortController = new AbortController()
  const timeout = setTimeout(
    () => abortController.abort(),
    input.configuration.timeoutMilliseconds
  )

  try {
    const response = await input.configuration.fetch(resendEmailEndpoint, {
      body: JSON.stringify({
        from: input.configuration.from,
        html: input.message.html,
        ...(input.configuration.replyTo === undefined
          ? {}
          : { reply_to: input.configuration.replyTo }),
        subject: input.message.subject,
        text: input.message.text,
        to: [input.deliveryInput.recipient.email],
      }),
      headers: {
        Authorization: `Bearer ${input.configuration.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "writing-app-auth/1.0",
      },
      method: "POST",
      signal: abortController.signal,
    })

    if (!response.ok) {
      throw new AuthEmailDeliveryError("provider-rejected")
    }
  } catch (error) {
    if (isAuthEmailDeliveryError(error)) {
      throw error
    }

    throw new AuthEmailDeliveryError(
      abortController.signal.aborted ? "timeout" : "unavailable"
    )
  } finally {
    clearTimeout(timeout)
  }
}
