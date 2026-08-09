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
    readonly onDelivery?: (delivery: InMemoryAuthEmailDeliveryRecord) => void
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
        onDelivery: input.onDelivery,
      })
    },
    async deliverVerification(deliveryInput) {
      createVerificationEmailMessage(deliveryInput)
      recordOrFail({
        deliveries,
        deliveryInput,
        failureCode: input.failureCode,
        kind: "verification",
        onDelivery: input.onDelivery,
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
  readonly onDelivery:
    | ((delivery: InMemoryAuthEmailDeliveryRecord) => void)
    | undefined
}): void {
  if (input.failureCode !== undefined) {
    throw new AuthEmailDeliveryError(input.failureCode)
  }

  const delivery = {
    callbackUrl: input.deliveryInput.callbackUrl,
    kind: input.kind,
    recipientEmail: input.deliveryInput.recipient.email,
  } as const
  input.deliveries.push(delivery)
  input.onDelivery?.({ ...delivery })
}
