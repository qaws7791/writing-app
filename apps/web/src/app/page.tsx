import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,_rgba(250,246,240,0.95)_0%,_rgba(243,235,225,0.92)_45%,_rgba(231,221,207,0.9)_100%)] px-5 py-6 text-foreground md:px-8 md:py-8">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-6xl flex-col rounded-[2.25rem] border border-foreground/10 bg-background/72 p-6 shadow-[0_28px_90px_rgba(61,43,31,0.11)] backdrop-blur-xl md:p-10">
        <header className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium tracking-[0.24em] text-muted-foreground uppercase">
            Writing App
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              로그인
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              회원가입
            </Link>
          </div>
        </header>

        <div className="my-auto grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <section className="max-w-3xl">
            <p className="mb-5 text-sm font-medium tracking-[0.22em] text-muted-foreground uppercase">
              Editorial Writing Space
            </p>
            <h1 className="text-5xl leading-[1.05] font-semibold tracking-tight md:text-7xl">
              매일의 생각을
              <br />
              과장 없이,
              <br />
              끝까지 적어내는 공간
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground md:text-lg">
              이메일 기반 계정으로 초안과 저장한 글감을 안전하게 이어가세요.
              화려한 방해 대신, 오래 머물 수 있는 편집 환경에 집중했습니다.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="rounded-full bg-foreground px-6 py-3 text-base font-semibold text-background transition-transform hover:-translate-y-0.5 hover:bg-foreground/90"
              >
                계정 만들기
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full border border-foreground/15 bg-background/80 px-6 py-3 text-base font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-background"
              >
                로그인하고 이어쓰기
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
            <article className="rounded-[1.75rem] border border-foreground/10 bg-background/88 p-5">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Focus
              </p>
              <p className="mt-3 text-lg font-semibold">
                글감 탐색, 저장, 초안 이어쓰기를 한 계정으로 묶습니다.
              </p>
            </article>
            <article className="rounded-[1.75rem] border border-foreground/10 bg-background/88 p-5">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Security
              </p>
              <p className="mt-3 text-lg font-semibold">
                이메일 검증과 비밀번호 재설정 흐름을 기본으로 제공합니다.
              </p>
            </article>
            <article className="rounded-[1.75rem] border border-foreground/10 bg-background/88 p-5">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Mobile First
              </p>
              <p className="mt-3 text-lg font-semibold">
                이동 중에도 바로 이어 쓸 수 있도록 모바일 화면을 우선합니다.
              </p>
            </article>
          </section>
        </div>
      </div>
    </main>
  )
}
