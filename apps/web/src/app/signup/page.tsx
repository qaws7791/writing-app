import type { Metadata } from "next"

import { AuthPage } from "@/features/auth/auth-page"
import { getSafeNextPath } from "@/lib/auth/auth-navigation"

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

  return (
    <AuthPage
      apiBaseUrl={
        process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:4000"
      }
      mode="signup"
      nextPath={nextPath}
    />
  )
}

function getNextPath(value: string | string[] | undefined) {
  return getSafeNextPath(Array.isArray(value) ? value[0] : value)
}
