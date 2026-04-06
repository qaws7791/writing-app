"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  MoreVerticalIcon,
  QuillWrite01Icon,
} from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"

interface WritingSummary {
  id: string
  date: string
  title: string
  excerpt: string
  wordCount: number
}

const MOCK_WRITINGS: WritingSummary[] = [
  {
    id: "1",
    date: "2024년 5월 12일",
    title: "단순한 삶을 위한 뺄셈",
    excerpt:
      "서랍을 정리하며 지난 3년간 한 번도 꺼내지 않은 물건들을 골라냈다. 마음의 짐 또한 마찬가지였다.",
    wordCount: 1240,
  },
  {
    id: "2",
    date: "2024년 5월 12일",
    title: "단순한 삶을 위한 뺄셈",
    excerpt:
      "서랍을 정리하며 지난 3년간 한 번도 꺼내지 않은 물건들을 골라냈다. 마음의 짐 또한 마찬가지였다.",
    wordCount: 1240,
  },
  {
    id: "3",
    date: "2024년 5월 12일",
    title: "단순한 삶을 위한 뺄셈",
    excerpt:
      "서랍을 정리하며 지난 3년간 한 번도 꺼내지 않은 물건들을 골라냈다. 마음의 짐 또한 마찬가지였다.",
    wordCount: 1240,
  },
  {
    id: "4",
    date: "2024년 5월 12일",
    title: "단순한 삶을 위한 뺄셈",
    excerpt:
      "서랍을 정리하며 지난 3년간 한 번도 꺼내지 않은 물건들을 골라냈다. 마음의 짐 또한 마찬가지였다.",
    wordCount: 1240,
  },
]

function WritingCard({ writing }: { writing: WritingSummary }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/writings/${writing.id}`)}
      className="flex flex-col gap-4 rounded-[2.25rem] bg-surface-container p-8 text-left transition-colors hover:bg-surface-container-high"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-[1px] text-on-surface-low uppercase">
          {writing.date}
        </span>
        <button
          type="button"
          aria-label="더보기"
          className="flex items-center justify-center text-on-surface-low"
          onClick={(e) => e.stopPropagation()}
        >
          <HugeiconsIcon
            icon={MoreVerticalIcon}
            size={16}
            color="currentColor"
            strokeWidth={2}
          />
        </button>
      </div>
      <h2 className="text-2xl font-bold tracking-[-0.6px] text-on-surface">
        {writing.title}
      </h2>
      <p className="line-clamp-2 text-base leading-relaxed text-on-surface-low">
        {writing.excerpt}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-on-surface-low" aria-hidden="true">
          ≡
        </span>
        <span className="text-[11px] font-semibold tracking-[1.1px] text-on-surface-low uppercase">
          {writing.wordCount.toLocaleString()} 단어
        </span>
      </div>
    </button>
  )
}

export default function WritingsListView() {
  const router = useRouter()

  return (
    <div className="relative flex flex-col bg-surface">
      {/* Header */}
      <div className="px-4 pt-4 pb-0">
        <h1 className="text-2xl font-semibold text-on-surface">글쓰기</h1>
      </div>

      {/* Search Bar */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2.5 rounded-[2rem] bg-surface-container px-6 py-5">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.5}
            className="shrink-0 text-on-surface-lowest"
          />
          <span className="text-base text-on-surface-lowest">
            기록된 생각을 검색해보세요
          </span>
        </div>
      </div>

      {/* Writing Cards */}
      <div className="flex flex-col gap-5 px-2 pt-5 pb-8">
        {MOCK_WRITINGS.map((writing) => (
          <WritingCard key={writing.id} writing={writing} />
        ))}
      </div>

      {/* FAB */}
      <button
        type="button"
        aria-label="새 글쓰기"
        className="fixed right-4 bottom-24 flex size-14 items-center justify-center rounded-[16px] bg-primary text-on-primary shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
        onClick={() => router.push("/writings/new")}
      >
        <HugeiconsIcon
          icon={QuillWrite01Icon}
          size={24}
          color="currentColor"
          strokeWidth={1.5}
        />
      </button>
    </div>
  )
}
