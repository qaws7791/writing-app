import {
  readAbsoluteHttpCallbackUrl,
  type AuthEmailDeliveryInput,
} from "#auth/email/delivery"

export type AuthEmailMessage = Readonly<{
  html: string
  subject: string
  text: string
}>

export function createVerificationEmailMessage(
  input: AuthEmailDeliveryInput
): AuthEmailMessage {
  const callbackUrl = readAbsoluteHttpCallbackUrl(input.callbackUrl).toString()
  const safeCallbackUrl = escapeHtml(callbackUrl)

  return {
    html: [
      "<p>안녕하세요.</p>",
      "<p>글결 가입을 완료하려면 아래 버튼을 눌러 이메일 주소를 확인해 주세요.</p>",
      `<p><a href="${safeCallbackUrl}">이메일 주소 확인하기</a></p>`,
      "<p>직접 요청하지 않았다면 이 메일을 무시해 주세요.</p>",
    ].join(""),
    subject: "[글결] 이메일 주소를 확인해 주세요",
    text: [
      "안녕하세요.",
      "",
      "글결 가입을 완료하려면 아래 링크에서 이메일 주소를 확인해 주세요.",
      callbackUrl,
      "",
      "직접 요청하지 않았다면 이 메일을 무시해 주세요.",
    ].join("\n"),
  }
}

export function createPasswordResetEmailMessage(
  input: AuthEmailDeliveryInput
): AuthEmailMessage {
  const callbackUrl = readAbsoluteHttpCallbackUrl(input.callbackUrl).toString()
  const safeCallbackUrl = escapeHtml(callbackUrl)

  return {
    html: [
      "<p>안녕하세요.</p>",
      "<p>글결 비밀번호를 다시 설정하려면 아래 버튼을 눌러 주세요.</p>",
      `<p><a href="${safeCallbackUrl}">비밀번호 다시 설정하기</a></p>`,
      "<p>직접 요청하지 않았다면 비밀번호는 변경되지 않으니 이 메일을 무시해 주세요.</p>",
    ].join(""),
    subject: "[글결] 비밀번호를 다시 설정해 주세요",
    text: [
      "안녕하세요.",
      "",
      "글결 비밀번호를 다시 설정하려면 아래 링크를 열어 주세요.",
      callbackUrl,
      "",
      "직접 요청하지 않았다면 비밀번호는 변경되지 않으니 이 메일을 무시해 주세요.",
    ].join("\n"),
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}
