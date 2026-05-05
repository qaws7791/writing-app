import Link from "next/link"
import { buttonVariants } from "@workspace/ui/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <span className="text-xl font-bold tracking-tight text-foreground">
          글숨 Labs
        </span>
        <Link
          href="/login"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          로그인
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
        <div className="flex max-w-md flex-col items-center text-center">
          <h1 className="text-4xl leading-[1.2] font-semibold tracking-tight text-foreground md:text-5xl">
            사진에서
            <br />첫 문장을 만들다
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            표현 재료를 고르고 문장 씨앗을 조립해
            <br />
            내가 직접 쓴 한 문장을 저장합니다.
          </p>

          <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className={buttonVariants({ variant: "default", size: "lg" })}
            >
              시작하기
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-muted-foreground/80">
        © 글숨 Labs
      </footer>
    </div>
  )
}
