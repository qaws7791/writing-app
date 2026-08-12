"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { buttonVariants } from "@workspace/ui/components/primitives/button"

export default function NotFound() {
  const pathname = usePathname()
  const isAppPage = pathname?.startsWith("/app")

  const redirectHref = isAppPage ? "/app" : "/"
  const redirectLabel = isAppPage ? "학습 홈으로 돌아가기" : "홈으로 돌아가기"

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-5 py-12 text-center text-foreground">
      <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-balance">
        페이지를 찾을 수 없어요
      </h1>
      <p className="mt-4 max-w-sm text-base leading-7 text-pretty text-muted-foreground">
        요청하신 페이지가 존재하지 않거나 삭제되었습니다.
      </p>
      <Link
        className={buttonVariants({ className: "mt-8 min-w-56", size: "lg" })}
        href={redirectHref}
      >
        {redirectLabel}
      </Link>
    </main>
  )
}
