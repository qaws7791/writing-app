import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthPage } from "@/features/auth/auth-page"
import { getSafeNextPath } from "@/lib/auth/auth-navigation"
import { getAuthenticatedAppRedirectPath } from "@/lib/auth/get-authenticated-app-redirect-path"
import { getServerWritingAppApi } from "@/lib/api/get-server-writing-app-api"

export const metadata: Metadata = {
  title: "회원가입 — 한글쓰기",
  description: "한글쓰기 계정을 만들고 글쓰기 학습을 시작합니다.",
}

type SignupPageProps = {
  searchParams: Promise<{
    next?: string | string[]
  }>
}

export default async function Page({ searchParams }: SignupPageProps) {
  const nextPath = getNextPath((await searchParams).next)
  const authenticatedRedirectPath = await getAuthenticatedAppRedirectPath(
    await getServerWritingAppApi(),
    nextPath
  )

  if (authenticatedRedirectPath) {
    redirect(authenticatedRedirectPath)
  }

  return <AuthPage mode="signup" nextPath={nextPath} />
}

function getNextPath(value: string | string[] | undefined) {
  return getSafeNextPath(Array.isArray(value) ? value[0] : value)
}
