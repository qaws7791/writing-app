"use client"

import Link from "next/link"
import { buttonVariants } from "@workspace/ui/components/ui/button"
import { Skeleton } from "@workspace/ui/components/ui/skeleton"
import { useHomeSnapshot } from "@/features/home"

export default function HomeView() {
  const { data, isPending, isError } = useHomeSnapshot()

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="px-6 py-6">
        <h1 className="text-xl leading-snug font-semibold text-foreground">
          글숨 Labs
        </h1>
      </header>

      <main className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 pb-8">
        <section className="flex flex-col gap-3">
          <h2 className="text-2xl leading-tight font-semibold text-foreground">
            사진 한 장에서 첫 문장을 시작합니다
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            표현 재료를 고르고, 문장 씨앗을 조립한 뒤, 직접 쓴 한 문장을 문체
            정원에 저장합니다.
          </p>
        </section>

        <section className="grid gap-3">
          {isPending ? (
            <>
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </>
          ) : isError ? (
            <p className="text-sm leading-6 text-muted-foreground">
              홈 정보를 불러올 수 없습니다.
            </p>
          ) : (
            data?.startActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
              >
                <p className="text-base leading-6 font-semibold text-foreground">
                  {action.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {action.description}
                </p>
              </Link>
            ))
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm leading-6 font-semibold text-foreground">
            문체 정원
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            저장한 카드 {data?.garden.cardCount ?? 0}개 · 문장{" "}
            {data?.garden.sentenceCount ?? 0}개
          </p>
        </section>

        <Link
          href="/photo"
          className={buttonVariants({ className: "w-full", size: "lg" })}
        >
          사진으로 시작
        </Link>
      </main>
    </div>
  )
}
