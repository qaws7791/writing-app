"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { PencilEdit02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { formatDraftMeta } from "@/lib/phase-one-format"
import { createPhaseOneRepository } from "@/lib/phase-one-repository"
import type { DraftSummary } from "@/lib/phase-one-types"

export default function WriteListPage() {
  const repository = useMemo(() => createPhaseOneRepository(), [])
  const [drafts, setDrafts] = useState<DraftSummary[]>([])

  useEffect(() => {
    let cancelled = false

    void repository.listDrafts().then((items) => {
      if (!cancelled) {
        setDrafts(items)
      }
    })

    return () => {
      cancelled = true
    }
  }, [repository])

  return (
    <div className="min-h-svh flex-1 bg-background px-6 py-16 md:px-10 md:py-20 lg:px-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-12 text-3xl leading-snug font-semibold tracking-tight text-foreground md:mb-16 md:text-4xl">
          내 글
        </h1>

        <section className="mb-14 md:mb-16">
          <Link
            href="/write/new"
            className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-border bg-card px-7 py-8 shadow-sm transition-all hover:border-foreground/15 hover:shadow-md md:px-10 md:py-10"
          >
            <div className="pointer-events-none absolute -right-8 -bottom-8 size-40 rounded-full bg-muted/70 transition-transform group-hover:scale-110" />
            <div className="pointer-events-none absolute top-4 -right-2 size-16 rounded-full bg-muted/40" />

            <div className="relative z-10 flex flex-col gap-2">
              <span className="text-xl font-semibold tracking-tight text-foreground">
                새 글 시작
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                설정 없이 바로 첫 문장을 쓸 수 있습니다
              </span>
            </div>

            <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <HugeiconsIcon
                icon={PencilEdit02Icon}
                size={20}
                color="currentColor"
                strokeWidth={2}
              />
            </div>
          </Link>
        </section>

        <section>
          <div className="flex flex-col">
            {drafts.map((draft, index) => (
              <Link
                key={draft.id}
                href={`/write/${draft.id}`}
                className="group"
              >
                <article
                  className={`flex flex-col gap-1 py-6 transition-colors ${
                    index !== drafts.length - 1
                      ? "border-b border-border/70"
                      : ""
                  }`}
                >
                  <h3 className="text-base leading-normal font-semibold text-foreground underline-offset-4 group-hover:underline md:text-lg">
                    {draft.title || "제목 없는 초안"}
                  </h3>
                  <p className="line-clamp-2 text-sm leading-7 font-normal text-muted-foreground md:text-base">
                    {draft.preview || "아직 본문이 없습니다."}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground md:text-sm">
                    <span>{formatDraftMeta(draft.lastSavedAt)}</span>
                    <span className="text-border">·</span>
                    <span>
                      {draft.characterCount.toLocaleString("ko-KR")}자
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
