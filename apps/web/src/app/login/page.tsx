import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthPage } from "@/features/auth/auth-page"
import { getSafeNextPath } from "@/lib/auth/auth-navigation"
import { getAuthenticatedAppRedirectPath } from "@/lib/auth/get-authenticated-app-redirect-path"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

export const metadata: Metadata = {
  title: "로그인 — 한글쓰기",
  description: "Google 계정으로 로그인하고 학습을 이어갑니다.",
}

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[]
  }>
}

export default async function Page({ searchParams }: LoginPageProps) {
  const nextPath = getNextPath((await searchParams).next)
  const authenticatedRedirectPath = await getAuthenticatedAppRedirectPath(
    await getServerWritingAppApi(),
    nextPath
  )

  if (authenticatedRedirectPath) {
    redirect(authenticatedRedirectPath)
  }

  return <AuthPage nextPath={nextPath} />
}

function getNextPath(value: string | string[] | undefined) {
  return getSafeNextPath(Array.isArray(value) ? value[0] : value)
}
