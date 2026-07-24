import { describe, expect, it } from "vitest"

import { createInMemoryAuthEmailDelivery } from "#auth/email/in-memory"

const deliveryInput = {
  callbackUrl: "https://app.example.test/api/auth/verify-email?token=token",
  recipient: {
    email: "learner@example.com",
    name: "학습자",
  },
}

describe("인메모리 인증 메일 전달", () => {
  it("검증과 비밀번호 재설정 전달을 순서대로 기록한다", async () => {
    const delivery = createInMemoryAuthEmailDelivery()

    await delivery.deliverVerification(deliveryInput)
    await delivery.deliverPasswordReset(deliveryInput)

    expect(delivery.readDeliveries()).toEqual([
      {
        callbackUrl: deliveryInput.callbackUrl,
        kind: "verification",
        recipientEmail: "learner@example.com",
      },
      {
        callbackUrl: deliveryInput.callbackUrl,
        kind: "password-reset",
        recipientEmail: "learner@example.com",
      },
    ])
  })

  it("설정한 정규화 실패만 노출한다", async () => {
    const delivery = createInMemoryAuthEmailDelivery({
      failureCode: "provider-rejected",
    })

    await expect(
      delivery.deliverVerification(deliveryInput)
    ).rejects.toMatchObject({
      code: "provider-rejected",
      message: "Auth email delivery failed: provider-rejected",
    })
    expect(delivery.readDeliveries()).toEqual([])
  })
})
