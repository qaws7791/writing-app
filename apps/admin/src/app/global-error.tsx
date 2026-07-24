"use client"

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
            <button
              className="mt-6 inline-flex h-11 items-center justify-center rounded-4xl bg-action-primary-bg px-5 py-2.5 font-bold text-action-primary-fg hover:opacity-90"
              onClick={reset}
              type="button"
            >
              다시 시도
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
