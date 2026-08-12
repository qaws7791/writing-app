import Link from "next/link"

import { buttonVariants } from "@workspace/ui/components/primitives/button"

export default function AdminNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="text-center">
        <h1 className="font-heading text-xl font-semibold">
          관리자 페이지를 찾을 수 없습니다.
        </h1>
        <Link className={buttonVariants({ className: "mt-6" })} href="/">
          대시보드로 돌아가기
        </Link>
      </div>
    </main>
  )
}
