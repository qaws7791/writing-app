import { APIError } from "better-auth/api"

export async function assertEmailSignUpAllowed(input: {
  email: string
  findExistingUserByEmail: (
    email: string
  ) => PromiseLike<{ email: string } | null | undefined>
}): Promise<void> {
  const email = input.email.trim().toLowerCase()

  if (!email) {
    return
  }

  const existingUser = await input.findExistingUserByEmail(email)

  if (!existingUser) {
    return
  }

  throw new APIError("CONFLICT", {
    message:
      "이미 가입된 이메일입니다. 로그인하거나 비밀번호 재설정을 사용해 주세요.",
  })
}
