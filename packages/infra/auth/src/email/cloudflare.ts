import {
  AuthEmailDeliveryError,
  type AuthEmailDeliveryPort,
  type AuthEmailDeliveryInput,
} from "#auth/email/delivery"
import {
  createPasswordResetEmailMessage,
  createVerificationEmailMessage,
  type AuthEmailMessage,
} from "#auth/email/templates"

export function createCloudflareAuthEmailDelivery(input: {
  readonly binding: SendEmail
  readonly from: string
  readonly replyTo?: string
}): AuthEmailDeliveryPort {
  async function deliver(
    recipient: AuthEmailDeliveryInput["recipient"],
    message: AuthEmailMessage
  ): Promise<void> {
    try {
      await input.binding.send({
        ...message,
        from: input.from,
        to: recipient.email,
        ...(input.replyTo === undefined ? {} : { replyTo: input.replyTo }),
      })
    } catch {
      throw new AuthEmailDeliveryError("unavailable")
    }
  }
  return {
    deliverPasswordReset: async (delivery) =>
      await deliver(
        delivery.recipient,
        createPasswordResetEmailMessage(delivery)
      ),
    deliverVerification: async (delivery) =>
      await deliver(
        delivery.recipient,
        createVerificationEmailMessage(delivery)
      ),
  }
}
