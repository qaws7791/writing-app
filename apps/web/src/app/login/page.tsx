import type { Metadata } from "next"

import { AuthPage } from "@/features/auth/auth-page"
import { getSafeNextPath } from "@/lib/auth/auth-navigation"

export const metadata: Metadata = {
  title: "로그인 — 한글쓰기",
  description: "한글쓰기 계정으로 로그인하고 학습을 이어갑니다.",
}

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[]
  }>
}

export default async function Page({ searchParams }: LoginPageProps) {
  const nextPath = getNextPath((await searchParams).next)

  return (
    <AuthPage
      apiBaseUrl={
        process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:4000"
      }
      mode="login"
      nextPath={nextPath}
    />
  )
}

function getNextPath(value: string | string[] | undefined) {
  return getSafeNextPath(Array.isArray(value) ? value[0] : value)
}
