"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Bookmark01Icon,
  BookmarkCheckIcon,
  PenConnectWifiIcon,
} from "@hugeicons/core-free-icons"
import { LevelDots } from "@/components/level-dots"
import { formatDraftMeta } from "@/lib/phase-one-format"
import { createPhaseOneRepository } from "@/lib/phase-one-repository"
import type { HomeSnapshot } from "@/lib/phase-one-types"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

export default function Page() {
  const repository = useMemo(() => createPhaseOneRepository(), [])
  const [home, setHome] = useState<HomeSnapshot | null>(null)

  useEffect(() => {
    let cancelled = false

    void repository.getHome().then((snapshot) => {
      if (!cancelled) {
        setHome(snapshot)
      }
    })

    return () => {
      cancelled = true
    }
  }, [repository])

  const resumeDraft = home?.resumeDraft ?? null

  return (
    <div className="min-h-svh flex-1 bg-background px-6 py-16 lg:px-24">
      <div className="mx-auto max-w-5xl">
        <section className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Phase 1 글쓰기 시작
            </p>
            <h1 className="text-3xl leading-snug font-medium tracking-tight text-foreground md:text-4xl">
              오늘도,
              <br />
              그냥 써봐요
            </h1>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground md:flex">
            <HugeiconsIcon
              icon={PenConnectWifiIcon}
              size={16}
              color="currentColor"
              strokeWidth={1.6}
            />
            백엔드가 없으면 로컬 fixture로 동작합니다
          </div>
        </section>

        {resumeDraft && (
          <section className="mb-14">
            <Link
              href={`/write/${resumeDraft.id}`}
              className="group block overflow-hidden rounded-3xl border border-border bg-card px-6 py-6 shadow-sm transition-all hover:border-foreground/15 hover:shadow-md md:px-8"
            >
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                이어서 쓰기
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {resumeDraft.title || "제목 없는 초안"}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
                {resumeDraft.preview || "첫 문장을 아직 쓰지 않았습니다."}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>{formatDraftMeta(resumeDraft.lastSavedAt)}</span>
                <span className="text-border">·</span>
                <span>
                  {resumeDraft.characterCount.toLocaleString("ko-KR")}자
                </span>
              </div>
            </Link>
          </section>
        )}

        <section className="mb-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">오늘의 글감</h2>
            <Link
              href="/prompts"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              더 보기
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(home?.todayPrompts ?? []).map((item) => (
              <Link
                key={item.id}
                href={`/prompts/${item.id}`}
                className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-foreground/15"
              >
                <p className="text-sm leading-6 font-medium text-foreground">
                  {item.text}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.topic}
                  </span>
                  <span className="text-xs text-border">·</span>
                  <LevelDots level={item.level} showLabel />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <Tabs defaultValue="drafts">
            <TabsList className="mb-6 gap-0">
              <TabsTrigger value="drafts">내가 쓰는 글</TabsTrigger>
              <TabsTrigger value="saved">저장한 글감</TabsTrigger>
            </TabsList>

            <TabsContent value="drafts">
              <div className="flex flex-col">
                {(home?.recentDrafts ?? []).map((draft, index, drafts) => (
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
                      <p className="line-clamp-2 text-sm leading-7 text-muted-foreground md:text-base">
                        {draft.preview || "첫 문장을 아직 쓰지 않았습니다."}
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
            </TabsContent>

            <TabsContent value="saved">
              <div className="flex flex-col">
                {(home?.savedPrompts ?? []).map((prompt) => (
                  <Link
                    key={prompt.id}
                    href={`/prompts/${prompt.id}`}
                    className="group flex items-center gap-4 rounded-xl py-3.5 transition-colors hover:bg-muted/60"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="text-sm leading-snug font-medium text-foreground underline-offset-4 group-hover:underline md:text-base">
                        {prompt.text}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {prompt.topic}
                        </span>
                        <span className="text-xs text-border">·</span>
                        <LevelDots level={prompt.level} showLabel />
                      </div>
                    </div>

                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground">
                      <HugeiconsIcon
                        icon={Bookmark01Icon}
                        altIcon={BookmarkCheckIcon}
                        showAlt={prompt.saved}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  )
}
