import type { Metadata } from "next"
import * as React from "react"

import { getAdminWebEnv } from "@/env"
import { AdminAuthPage } from "@/features/auth/admin-auth-page"
import { getSafeAdminNextPath } from "@/lib/auth/admin-auth-navigation"

export const metadata: Metadata = {
  title: "관리자 로그인 — 한글쓰기 어드민",
  description: "한글쓰기 운영 도구에 로그인합니다.",
}

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[]
  }>
}

export default async function Page({ searchParams }: LoginPageProps) {
  const nextPath = getNextPath((await searchParams).next)
  const env = getAdminWebEnv()

  return <AdminAuthPage authBaseUrl={env.adminApiBaseUrl} nextPath={nextPath} />
}

function getNextPath(value: string | string[] | undefined) {
  return getSafeAdminNextPath(Array.isArray(value) ? value[0] : value)
}
