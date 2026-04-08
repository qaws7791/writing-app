import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex items-center justify-between px-6 py-5">
        <span className="text-xl font-bold tracking-tight text-on-surface">
          글필
        </span>
        <Link
          href="/login"
          className="rounded-xl bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          로그인
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
        <div className="flex max-w-md flex-col items-center text-center">
          <h1 className="text-4xl leading-[1.2] font-semibold tracking-tight text-on-surface md:text-5xl">
            글쓰기로
            <br />
            나를 발견하다
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-on-surface-low">
            매일의 글감과 여정을 따라가며
            <br />
            나만의 글쓰기 습관을 만들어보세요.
          </p>

          <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="rounded-2xl bg-primary px-8 py-3.5 text-center text-base font-semibold text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container"
            >
              시작하기
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-on-surface-lowest">
        © 글필
      </footer>
    </div>
  )
}
