export const INVALID_TOKEN_CODES: ReadonlySet<string> = new Set([
  "INVALID_TOKEN",
  "invalid_token",
])

export const SIGN_IN_PATH = "/sign-in"
export const PASSWORD_MIN_LENGTH = 8
export const AUTH_MESSAGES = {
  COMMON: {
    INVALID_EMAIL: "올바른 이메일 주소를 입력해 주세요.",
    PASSWORD_MIN: `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`,
    PASSWORD_MISMATCH: "비밀번호 확인이 일치하지 않습니다.",
  },
  SIGN_IN: {
    FAILED: "로그인에 실패했습니다. 입력값을 다시 확인해 주세요.",
    INVALID_TOKEN:
      "인증 링크가 유효하지 않거나 만료되었습니다. 다시 가입하거나 새 링크를 요청해 주세요.",
    EMAIL_VERIFIED: "이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다.",
  },
  PASSWORD_RESET: {
    INVALID_TOKEN: "재설정 링크가 유효하지 않거나 만료되었습니다.",
    MISSING_TOKEN: "재설정 토큰이 없습니다. 이메일의 링크를 다시 열어 주세요.",
    FAILED: "비밀번호를 재설정하지 못했습니다.",
  },
}
