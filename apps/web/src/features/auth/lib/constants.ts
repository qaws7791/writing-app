export const INVALID_TOKEN_CODES: ReadonlySet<string> = new Set([
  "INVALID_TOKEN",
  "invalid_token",
])

export const SIGN_IN_PATH = "/sign-in"
export const PASSWORD_MIN_LENGTH = 8
export const ERROR_MESSAGES = {
  PASSWORD_MIN: `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`,
  PASSWORD_MISMATCH: "비밀번호 확인이 일치하지 않습니다.",
  INVALID_TOKEN: "재설정 링크가 유효하지 않거나 만료되었습니다.",
  MISSING_TOKEN: "재설정 토큰이 없습니다. 이메일의 링크를 다시 열어 주세요.",
  RESET_FAILED: "비밀번호를 재설정하지 못했습니다.",
} as const
