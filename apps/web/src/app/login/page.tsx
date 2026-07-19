import type { Metadata } from "next"

import { AuthPage } from "@/features/authentication/ui/auth-page"
import { resolveSafeNextPath } from "@/features/authentication/model/auth-navigation"
import { parseLoginSearchParams } from "@/features/authentication/model/login-search-params"
import { readTestAuthEnabled } from "@/server/env/runtime-config"

export const metadata: Metadata = {
  title: "로그인",
}

type LoginPageProps = {
  readonly searchParams?: Promise<{
    readonly next?: string | readonly string[]
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = parseLoginSearchParams(await searchParams)
  const nextPath = resolveSafeNextPath(query.next)

  return (
    <AuthPage nextPath={nextPath} testAuthEnabled={readTestAuthEnabled()} />
  )
}
