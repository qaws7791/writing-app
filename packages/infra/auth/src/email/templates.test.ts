import { describe, expect, it } from "vitest"

import {
  createPasswordResetEmailMessage,
  createVerificationEmailMessage,
} from "#auth/email/templates"

const deliveryInput = {
  callbackUrl:
    "https://app.example.test/api/auth/verify-email?token=token&callbackURL=https%3A%2F%2Fapp.example.test%2Flogin",
  recipient: {
    email: "learner@example.com",
    name: "학습자",
  },
}

describe("인증 메일 템플릿", () => {
  it.each([
    ["이메일 확인", createVerificationEmailMessage],
    ["비밀번호 재설정", createPasswordResetEmailMessage],
  ] as const)(
    "%s 메일은 callback URL을 text에 담고 HTML에서 escape한다",
    (_label, createMessage) => {
      const message = createMessage(deliveryInput)

      expect(message.text).toContain(deliveryInput.callbackUrl)
      expect(message.html).toContain(
        "token=token&amp;callbackURL=https%3A%2F%2Fapp.example.test%2Flogin"
      )
      expect(message.html).not.toContain(deliveryInput.callbackUrl)
    }
  )

  it.each([
    "/api/auth/verify-email",
    "javascript:alert(1)",
    "https://user:password@app.example.test/verify",
  ])("절대 HTTP(S) callback이 아닌 %s를 거절한다", (callbackUrl) => {
    expect(() =>
      createVerificationEmailMessage({ ...deliveryInput, callbackUrl })
    ).toThrowError("Auth email delivery failed: invalid-callback-url")
  })
})
