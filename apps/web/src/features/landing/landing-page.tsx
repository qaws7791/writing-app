import Link from "next/link"

import { Button } from "@workspace/ui/components/ui/button"
import {
  BookOpenIcon,
  CheckIcon,
  PlayIcon,
} from "@workspace/ui/components/icons"

const landingHighlights = [
  "짧은 레슨으로 문장 기준을 익힙니다.",
  "직접 쓴 답변을 저장하고 이어서 학습합니다.",
  "AI 피드백으로 다음 수정 방향을 확인합니다.",
]

export function LandingPage() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto flex min-h-svh max-w-5xl flex-col justify-center gap-10 px-5 py-16 sm:px-8">
        <div className="flex max-w-2xl flex-col gap-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BookOpenIcon className="size-6" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="m-0 text-4xl/12 font-bold tracking-normal sm:text-5xl/15">
              한글쓰기
            </h1>
            <p className="m-0 text-lg/8 text-muted-foreground sm:text-xl/9">
              한국어 글쓰기의 기준을 배우고, 한 문장씩 직접 써 보며 실력을 쌓는
              학습 공간입니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              nativeButton={false}
              render={<Link href="/login?next=%2Fapp" />}
              size="lg"
              className="w-full sm:w-auto"
            >
              <span>앱 시작하기</span>
              <PlayIcon data-icon="inline-end" className="fill-current" />
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/login?next=%2Fapp%2Fcourses" />}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              코스 둘러보기
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {landingHighlights.map((highlight) => (
            <div
              key={highlight}
              className="flex min-h-20 items-start gap-3 rounded-lg border border-border bg-card p-4"
            >
              <CheckIcon
                className="mt-1 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <p className="m-0 text-sm/6 font-medium text-card-foreground">
                {highlight}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
