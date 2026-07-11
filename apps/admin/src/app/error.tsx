"use client"

import { Button } from "@workspace/ui/components/ui/button"

export default function AdminRouteError({
  reset,
}: {
  readonly error: Error & { readonly digest?: string }
  readonly reset: () => void
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="max-w-md rounded-panel bg-surface p-8 text-center">
        <h1 className="text-heading-sm font-black">
          관리자 화면을 불러오지 못했습니다.
        </h1>
        <p className="mt-3 text-body-md text-muted-foreground">
          잠시 후 다시 시도해 주세요.
        </p>
        <Button className="mt-6" onClick={reset} type="button">
          다시 시도
        </Button>
      </div>
    </main>
  )
}
