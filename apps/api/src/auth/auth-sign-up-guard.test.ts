import { describe, expect, test } from "vitest"

import { assertEmailSignUpAllowed } from "./auth-sign-up-guard.js"

describe("auth sign-up guard", () => {
  test("allows a new email address", async () => {
    await expect(
      assertEmailSignUpAllowed({
        email: "new-user@example.com",
        findExistingUserByEmail: async () => null,
      })
    ).resolves.toBeUndefined()
  })

  test("rejects an already registered email address", async () => {
    await expect(
      assertEmailSignUpAllowed({
        email: "existing@example.com",
        findExistingUserByEmail: async (email) => ({ email }),
      })
    ).rejects.toMatchObject({
      message:
        "이미 가입된 이메일입니다. 로그인하거나 비밀번호 재설정을 사용해 주세요.",
    })
  })
})
