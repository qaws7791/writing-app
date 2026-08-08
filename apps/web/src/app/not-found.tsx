"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { buttonVariants } from "@workspace/ui/components/ui/button"

export default function NotFound() {
  const pathname = usePathname()
  const isAppPage = pathname?.startsWith("/app")

  const redirectHref = isAppPage ? "/app" : "/"
  const redirectLabel = isAppPage ? "대시보드로 돌아가기" : "홈으로 돌아가기"

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-center text-foreground">
      <div className="mb-6 text-[3.5rem]">🌌</div>
      <h1 className="mb-4 text-[1.75rem] font-black text-foreground">
        페이지를 찾을 수 없어요
      </h1>
      <p className="mb-8 text-[1.125rem] font-medium text-muted-foreground">
        요청하신 페이지가 존재하지 않거나 삭제되었습니다.
      </p>
      <div className="w-64">
        <Link
          href={redirectHref}
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          {redirectLabel}
        </Link>
      </div>
    </main>
  )
}
