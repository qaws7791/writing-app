import type {
  AuthEmailDeliveryFailureCode,
  AuthEmailDeliveryInput,
  AuthEmailDeliveryPort,
} from "#auth/email/delivery"
import { AuthEmailDeliveryError } from "#auth/email/delivery"
import {
  createPasswordResetEmailMessage,
  createVerificationEmailMessage,
} from "#auth/email/templates"

export type InMemoryAuthEmailDeliveryRecord = Readonly<{
  callbackUrl: string
  kind: "password-reset" | "verification"
  recipientEmail: string
}>

export type InMemoryAuthEmailDelivery = AuthEmailDeliveryPort &
  Readonly<{
    readDeliveries: () => readonly InMemoryAuthEmailDeliveryRecord[]
  }>

export function createInMemoryAuthEmailDelivery(
  input: {
    readonly failureCode?: AuthEmailDeliveryFailureCode
  } = {}
): InMemoryAuthEmailDelivery {
  const deliveries: InMemoryAuthEmailDeliveryRecord[] = []

  return {
    async deliverPasswordReset(deliveryInput) {
      createPasswordResetEmailMessage(deliveryInput)
      recordOrFail({
        deliveries,
        deliveryInput,
        failureCode: input.failureCode,
        kind: "password-reset",
      })
    },
    async deliverVerification(deliveryInput) {
      createVerificationEmailMessage(deliveryInput)
      recordOrFail({
        deliveries,
        deliveryInput,
        failureCode: input.failureCode,
        kind: "verification",
      })
    },
    readDeliveries() {
      return deliveries.map((delivery) => ({ ...delivery }))
    },
  }
}

function recordOrFail(input: {
  readonly deliveries: InMemoryAuthEmailDeliveryRecord[]
  readonly deliveryInput: AuthEmailDeliveryInput
  readonly failureCode: AuthEmailDeliveryFailureCode | undefined
  readonly kind: InMemoryAuthEmailDeliveryRecord["kind"]
}): void {
  if (input.failureCode !== undefined) {
    throw new AuthEmailDeliveryError(input.failureCode)
  }

  input.deliveries.push({
    callbackUrl: input.deliveryInput.callbackUrl,
    kind: input.kind,
    recipientEmail: input.deliveryInput.recipient.email,
  })
}
