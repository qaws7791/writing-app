"use client"

import Link from "next/link"
import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Bookmark01Icon,
  BookmarkCheckIcon,
  SearchIcon,
} from "@hugeicons/core-free-icons"
import { LevelDots } from "@/components/level-dots"
import { createPhaseOneRepository } from "@/lib/phase-one-repository"
import type { PromptSummary, PromptTopic } from "@/lib/phase-one-types"

const topicChips: Array<PromptTopic> = [
  "일상",
  "사회",
  "관계",
  "기술",
  "자기이해",
  "진로",
  "문화",
  "성장",
  "여행",
]

export default function PromptsPage() {
  const repository = useMemo(() => createPhaseOneRepository(), [])
  const [prompts, setPrompts] = useState<PromptSummary[]>([])
  const [search, setSearch] = useState("")
  const [activeTopic, setActiveTopic] = useState<PromptTopic | null>(null)
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    let cancelled = false

    void repository.listPrompts().then((items) => {
      if (!cancelled) {
        setPrompts(items)
      }
    })

    return () => {
      cancelled = true
    }
  }, [repository])

  const filteredPrompts = useMemo(() => {
    const normalizedQuery = deferredSearch.trim().toLowerCase()

    return prompts.filter((prompt) => {
      if (activeTopic && prompt.topic !== activeTopic) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return (
        prompt.text.toLowerCase().includes(normalizedQuery) ||
        prompt.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
      )
    })
  }, [activeTopic, deferredSearch, prompts])

  async function handleToggleSave(promptId: number) {
    const target = prompts.find((prompt) => prompt.id === promptId)
    if (!target) return

    if (target.saved) {
      await repository.unsavePrompt(promptId)
    } else {
      await repository.savePrompt(promptId)
    }

    setPrompts((current) =>
      current.map((prompt) =>
        prompt.id === promptId ? { ...prompt, saved: !prompt.saved } : prompt
      )
    )
  }

  return (
    <div className="min-h-svh flex-1 bg-background px-6 py-16 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-foreground md:text-4xl">
            글감 찾기
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            검색과 주제 필터로 오늘의 시작점을 좁혀보세요.
          </p>
        </header>

        <section className="mb-8">
          <div className="relative flex-1">
            <HugeiconsIcon
              icon={SearchIcon}
              size={18}
              color="currentColor"
              strokeWidth={1.5}
              className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="주제, 키워드, 감정으로 검색"
              className="h-11 w-full rounded-xl border border-input bg-card pr-4 pl-11 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-ring"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTopic(null)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeTopic === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-border hover:ring-ring/50"
              }`}
            >
              전체
            </button>
            {topicChips.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setActiveTopic(topic)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  activeTopic === topic
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground ring-1 ring-border hover:ring-ring/50"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex flex-col">
            {filteredPrompts.map((prompt) => (
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

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault()
                    void handleToggleSave(prompt.id)
                  }}
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-all ${
                    prompt.saved
                      ? "text-foreground"
                      : "text-muted-foreground/60 hover:text-foreground"
                  }`}
                  aria-label={prompt.saved ? "저장 해제" : "글감 저장"}
                >
                  <HugeiconsIcon
                    icon={Bookmark01Icon}
                    altIcon={BookmarkCheckIcon}
                    showAlt={prompt.saved}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.5}
                  />
                </button>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
