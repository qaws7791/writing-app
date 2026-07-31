import {
  createAdminAuthClient,
  isAdminAuthClientError,
} from "@workspace/auth/admin/client"

import { resolveSafeAdminNextPath } from "@/features/authentication/model/admin-auth-navigation"

const adminLoginMessages = {
  "invalid-credentials": "이메일 또는 비밀번호를 확인하세요.",
  "rate-limited":
    "로그인 시도가 많아 잠시 차단되었습니다. 1분 뒤에 다시 시도하세요.",
  unknown: "로그인하지 못했습니다. 잠시 뒤에 다시 시도하세요.",
} as const

export function readAdminLoginErrorMessage(error: unknown): string {
  return isAdminAuthClientError(error)
    ? adminLoginMessages[error.code]
    : adminLoginMessages.unknown
}

export async function requestAdminPasswordLogin({
  email,
  nextPath,
  password,
}: {
  readonly email: string
  readonly nextPath: string
  readonly password: string
}): Promise<{ readonly nextPath: string }> {
  const safeNextPath = resolveSafeAdminNextPath(nextPath)
  await getAdminAuthClient().signInWithPassword({
    callbackURL: safeNextPath,
    email,
    password,
  })

  return { nextPath: safeNextPath }
}

export async function requestAdminSignOut(): Promise<void> {
  await getAdminAuthClient().signOut()
}

function getAdminAuthClient() {
  return createAdminAuthClient({
    fetch: globalThis.fetch.bind(globalThis),
  })
}
