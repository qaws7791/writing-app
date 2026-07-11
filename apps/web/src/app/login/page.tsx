import type { Metadata } from "next"

import { AuthPage } from "@/features/auth/auth-page"
import { resolveSafeNextPath } from "@/lib/auth/auth-navigation"
import { readTestAuthEnabled } from "@/runtime-config-server"

export const metadata: Metadata = {
  title: "로그인",
}

type LoginPageProps = {
  readonly searchParams?: Promise<{
    readonly next?: string | readonly string[]
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams
  const nextPath = resolveSafeNextPath(query?.next)

  return (
    <AuthPage nextPath={nextPath} testAuthEnabled={readTestAuthEnabled()} />
  )
}
