"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SearchIcon,
  Bookmark01Icon,
  BookmarkCheckIcon,
} from "@hugeicons/core-free-icons"
import { LevelDots } from "@/components/level-dots"

// ─── 목 데이터 ─────────────────────────────────────────────

/** 관심 주제 칩 */
const topicChips = [
  { id: "daily", label: "일상", active: true },
  { id: "society", label: "사회" },
  { id: "relationship", label: "관계" },
  { id: "tech", label: "기술" },
  { id: "self", label: "자기이해" },
  { id: "career", label: "진로" },
  { id: "culture", label: "문화" },
  { id: "memory", label: "기억" },
  { id: "imagination", label: "상상" },
]

/** 글감 타입 */
interface Prompt {
  id: number
  text: string
  topic: string
  level: 1 | 2 | 3
  bookmarked?: boolean
}

/** 전체 글감 */
const allPrompts: Prompt[] = [
  {
    id: 1,
    text: "최근에 내 생각이 바뀐 순간은?",
    topic: "자기이해",
    level: 1,
    bookmarked: true,
  },
  {
    id: 2,
    text: "사람들은 왜 익숙한 것을 떠나기 어려울까?",
    topic: "사회",
    level: 2,
  },
  {
    id: 3,
    text: "내가 가장 편안함을 느끼는 장소를 묘사해보세요",
    topic: "일상",
    level: 1,
  },
  {
    id: 4,
    text: "10년 후의 나에게 편지를 써보세요",
    topic: "자기이해",
    level: 2,
  },
  {
    id: 5,
    text: "최근에 읽은 글에서 가장 인상 깊었던 문장은?",
    topic: "문화",
    level: 1,
  },
  {
    id: 6,
    text: "AI가 일상에 들어오면서 잃어가는 것은?",
    topic: "기술",
    level: 3,
  },
  {
    id: 7,
    text: "내 하루에서 가장 조용한 순간은 언제인가요?",
    topic: "일상",
    level: 1,
    bookmarked: true,
  },
  {
    id: 8,
    text: "어른이 된다는 건 무엇을 포기하는 것일까?",
    topic: "자기이해",
    level: 2,
  },
  {
    id: 9,
    text: "가장 최근에 누군가에게 고마웠던 순간",
    topic: "관계",
    level: 1,
  },
  {
    id: 10,
    text: "지금 내가 살고 있는 동네의 숨은 매력",
    topic: "일상",
    level: 1,
  },
]

// ─── 글감 리스트 아이템 ─────────────────────────────────────

function PromptListItem({ prompt }: { prompt: Prompt }) {
  return (
    <Link
      href={`/prompts/${prompt.id}`}
      className="group flex items-center gap-4 rounded-xl py-3.5 transition-colors hover:bg-muted/60"
    >
      {/* 본문 */}
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

      {/* 북마크 */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          // 북마크 토글 로직 추가 예정
        }}
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-all ${
          prompt.bookmarked
            ? "text-foreground"
            : "text-muted-foreground/60 hover:text-foreground"
        }`}
        aria-label="북마크"
      >
        <HugeiconsIcon
          icon={prompt.bookmarked ? BookmarkCheckIcon : Bookmark01Icon}
          size={16}
          strokeWidth={1.5}
        />
      </button>
    </Link>
  )
}

// ─── 페이지 ────────────────────────────────────────────────

export default function PromptsPage() {
  return (
    <div className="min-h-svh flex-1 bg-background px-6 py-16 lg:px-16">
      <div className="mx-auto max-w-6xl">
        {/* ── 페이지 타이틀 ── */}
        <header className="mb-10">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-foreground md:text-4xl">
            글감 찾기
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            오늘은 어떤 이야기를 써볼까요?
          </p>
        </header>

        {/* ── 검색 + 필터 ── */}
        <section className="mb-8">
          <div className="flex items-center gap-3">
            {/* 검색 */}
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={SearchIcon}
                size={18}
                strokeWidth={1.5}
                className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="주제, 키워드, 감정으로 검색"
                className="h-11 w-full rounded-xl border border-input bg-card pr-4 pl-11 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
          </div>

          {/* 주제 칩 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {topicChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  chip.active
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground ring-1 ring-border hover:ring-ring/50"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── 글감 리스트 ── */}
        <section className="mb-12">
          <div className="flex flex-col">
            {allPrompts.map((prompt) => (
              <PromptListItem key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
