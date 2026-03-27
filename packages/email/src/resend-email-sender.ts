import { Resend } from "resend"

import type { EmailSender } from "./email-sender"

export type ResendEmailConfig = {
  apiKey: string
  fromAddress: string
}

export function createResendEmailSender(
  config: ResendEmailConfig
): EmailSender {
  const resend = new Resend(config.apiKey)

  return {
    async sendPasswordResetEmail(input) {
      await resend.emails.send({
        from: config.fromAddress,
        to: input.email,
        subject: "비밀번호 재설정",
        html: `<p>아래 링크를 클릭하여 비밀번호를 재설정하세요.</p><p><a href="${escapeHtml(input.url)}">비밀번호 재설정</a></p>`,
      })
    },

    async sendVerificationEmail(input) {
      await resend.emails.send({
        from: config.fromAddress,
        to: input.email,
        subject: "이메일 인증",
        html: `<p>아래 링크를 클릭하여 이메일을 인증하세요.</p><p><a href="${escapeHtml(input.url)}">이메일 인증</a></p>`,
      })
    },
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
