/** 이메일 발송을 위한 포트 인터페이스 */
export type EmailSender = {
  sendPasswordResetEmail: (input: {
    email: string
    token: string
    url: string
  }) => Promise<void>
  sendVerificationEmail: (input: {
    email: string
    token: string
    url: string
  }) => Promise<void>
}
