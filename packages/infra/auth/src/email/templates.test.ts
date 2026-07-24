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
  it("이메일 확인 링크를 한국어 text와 HTML로 만든다", () => {
    const message = createVerificationEmailMessage(deliveryInput)

    expect(message.subject).toBe("[글결] 이메일 주소를 확인해 주세요")
    expect(message.text).toContain(deliveryInput.callbackUrl)
    expect(message.html).toContain(
      "token=token&amp;callbackURL=https%3A%2F%2Fapp.example.test%2Flogin"
    )
    expect(message.html).toContain("이메일 주소 확인하기")
  })

  it("비밀번호 재설정 링크를 한국어 text와 HTML로 만든다", () => {
    const message = createPasswordResetEmailMessage(deliveryInput)

    expect(message.subject).toBe("[글결] 비밀번호를 다시 설정해 주세요")
    expect(message.text).toContain("비밀번호를 다시 설정")
    expect(message.html).toContain("비밀번호 다시 설정하기")
  })

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
