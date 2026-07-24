import { describe, expect, it, vi } from "vitest"

import {
  createResendAuthEmailDelivery,
  type AuthEmailFetch,
} from "#auth/email/resend"

const deliveryInput = {
  callbackUrl:
    "https://app.example.test/api/auth/verify-email?token=token&callbackURL=https%3A%2F%2Fapp.example.test%2Flogin",
  recipient: {
    email: "learner@example.com",
    name: "학습자",
  },
}

describe("Resend 인증 메일 adapter", () => {
  it("공식 send email API에 text와 HTML 메시지를 전달한다", async () => {
    const fetchImplementation = vi.fn<AuthEmailFetch>(async () =>
      Response.json({ id: "id" })
    )
    const delivery = createResendAuthEmailDelivery({
      apiKey: "resend-secret",
      fetch: fetchImplementation,
      from: "글결 <auth@example.com>",
      replyTo: "support@example.com",
    })

    await delivery.deliverVerification(deliveryInput)

    expect(fetchImplementation).toHaveBeenCalledOnce()
    const requestCall = fetchImplementation.mock.calls[0]
    if (requestCall === undefined) {
      throw new Error("Resend 요청이 기록되지 않았습니다.")
    }
    const [url, request] = requestCall
    expect(url).toBe("https://api.resend.com/emails")
    expect(request).toMatchObject({
      headers: {
        Authorization: "Bearer resend-secret",
        "Content-Type": "application/json",
        "User-Agent": "writing-app-auth/1.0",
      },
      method: "POST",
    })
    expect(JSON.parse(String(request?.body))).toMatchObject({
      from: "글결 <auth@example.com>",
      reply_to: "support@example.com",
      subject: "[글결] 이메일 주소를 확인해 주세요",
      to: ["learner@example.com"],
    })
  })

  it("provider 응답 본문과 secret을 노출하지 않고 실패를 정규화한다", async () => {
    const providerBody = "provider-body-sentinel"
    const secret = "resend-secret-sentinel"
    const delivery = createResendAuthEmailDelivery({
      apiKey: secret,
      fetch: vi.fn<AuthEmailFetch>(
        async () => new Response(providerBody, { status: 422 })
      ),
      from: "auth@example.com",
    })

    const error = await delivery
      .deliverVerification(deliveryInput)
      .catch((caught: unknown) => caught)

    expect(error).toMatchObject({
      code: "provider-rejected",
      message: "Auth email delivery failed: provider-rejected",
    })
    expect(JSON.stringify(error)).not.toContain(providerBody)
    expect(JSON.stringify(error)).not.toContain(secret)
  })

  it("제한 시간에 도달하면 timeout으로 정규화한다", async () => {
    const fetchImplementation = vi.fn<AuthEmailFetch>(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"))
          })
        })
    )
    const delivery = createResendAuthEmailDelivery({
      apiKey: "resend-secret",
      fetch: fetchImplementation,
      from: "auth@example.com",
      timeoutMilliseconds: 1,
    })

    await expect(
      delivery.deliverVerification(deliveryInput)
    ).rejects.toMatchObject({
      code: "timeout",
      message: "Auth email delivery failed: timeout",
    })
  })

  it("불완전한 구성은 provider 호출 전 fail-closed한다", () => {
    expect(() =>
      createResendAuthEmailDelivery({
        apiKey: " ",
        from: "auth@example.com",
      })
    ).toThrowError(
      expect.objectContaining({
        code: "configuration-invalid",
      })
    )
  })
})
