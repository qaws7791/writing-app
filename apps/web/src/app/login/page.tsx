import type { Metadata } from "next"

import { AuthPage } from "@/features/authentication/ui/auth-page"
import { resolveSafeNextPath } from "@/features/authentication/model/auth-navigation"
import { parseLoginSearchParams } from "@/features/authentication/model/login-search-params"

export const metadata: Metadata = {
  title: "로그인 및 가입",
}

type LoginPageProps = {
  readonly searchParams?: Promise<{
    readonly authError?: string | readonly string[]
    readonly error?: string | readonly string[]
    readonly next?: string | readonly string[]
    readonly verified?: string | readonly string[]
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = parseLoginSearchParams(await searchParams)
  const nextPath = resolveSafeNextPath(query.next)

  return (
    <AuthPage
      authenticationStatus={query.authenticationStatus}
      nextPath={nextPath}
      verificationStatus={query.verificationStatus}
    />
  )
}
