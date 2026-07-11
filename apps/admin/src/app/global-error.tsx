"use client"

import { Button } from "@workspace/ui/components/ui/button"

export default function AdminGlobalError({
  reset,
}: {
  readonly error: Error & { readonly digest?: string }
  readonly reset: () => void
}) {
  return (
    <html lang="ko">
      <body>
        <main className="flex min-h-screen items-center justify-center px-5">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-black">
              관리자 앱에 문제가 발생했습니다.
            </h1>
            <p className="mt-3">작업 내용은 유지한 채 다시 시도합니다.</p>
            <Button className="mt-6" onClick={reset} type="button">
              다시 시도
            </Button>
          </div>
        </main>
      </body>
    </html>
  )
}
