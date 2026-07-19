import Link from "next/link"

export default function AdminNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="text-center">
        <h1 className="text-heading-sm font-black">
          관리자 페이지를 찾을 수 없습니다.
        </h1>
        <Link
          className="mt-6 inline-flex h-11 items-center justify-center rounded-4xl bg-charcoal px-5 py-2.5 font-bold text-cream hover:opacity-90"
          href="/"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </main>
  )
}
