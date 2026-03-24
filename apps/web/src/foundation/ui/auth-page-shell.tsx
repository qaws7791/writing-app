import Link from "next/link"

type AuthPageShellProps = {
  children: React.ReactNode
  description: string
  footer: React.ReactNode
  title: string
}

export function AuthPageShell({
  children,
  description,
  footer,
  title,
}: AuthPageShellProps) {
  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(244,239,230,0.84)_42%,_rgba(227,217,203,0.62)_100%)] px-5 py-8 text-foreground md:px-8 md:py-12">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl flex-col justify-between gap-10 rounded-[2rem] border border-foreground/10 bg-background/75 p-6 shadow-[0_24px_80px_rgba(61,43,31,0.10)] backdrop-blur-xl md:p-10">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            Writing App
          </Link>
          <p className="text-xs font-medium text-muted-foreground">
            조용한 시작, 분명한 기록
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="flex flex-col gap-5">
            <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Better Auth
            </p>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
                {title}
              </h1>
              <p className="max-w-lg text-base leading-8 text-muted-foreground md:text-lg">
                {description}
              </p>
            </div>

            <div className="grid max-w-xl gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="rounded-2xl border border-foreground/10 bg-background/80 p-4">
                이메일과 비밀번호만으로 글감, 초안, 저장 흐름을 한 계정에
                묶습니다.
              </div>
              <div className="rounded-2xl border border-foreground/10 bg-background/80 p-4">
                검증 메일과 재설정 링크는 개발 환경에서 추적 가능한 형태로
                남깁니다.
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-foreground/10 bg-background/92 p-5 shadow-[0_20px_60px_rgba(34,26,20,0.08)] md:p-7">
            {children}
          </section>
        </div>

        <footer className="border-t border-foreground/10 pt-5 text-sm text-muted-foreground">
          {footer}
        </footer>
      </div>
    </main>
  )
}
