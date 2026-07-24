import type { Metadata } from "next"

import { parsePasswordResetSearchParams } from "@/features/authentication/model/password-reset-search-params"
import { PasswordResetPage } from "@/features/authentication/ui/password-reset-page"

export const metadata: Metadata = {
  title: "비밀번호 재설정",
}

type ResetPasswordRouteProps = {
  readonly searchParams?: Promise<{
    readonly error?: string | readonly string[]
    readonly token?: string | readonly string[]
  }>
}

export default async function ResetPasswordRoute({
  searchParams,
}: ResetPasswordRouteProps) {
  const { token } = parsePasswordResetSearchParams(await searchParams)

  return <PasswordResetPage token={token} />
}
