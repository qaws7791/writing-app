"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  MoreHorizontalIcon,
  BookOpen01Icon,
  ArrowDown01Icon,
  Home01Icon,
  QuillWrite01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"

interface WritingDetailData {
  id: string
  title: string
  date: string
  author: string
  prompt?: {
    id: string
    title: string
  }
  paragraphs: WritingBlock[]
}

type WritingBlock =
  | { type: "paragraph"; content: string }
  | { type: "quote"; content: string }

const BOTTOM_NAV_ITEMS = [
  { icon: Home01Icon, label: "홈" },
  { icon: BookOpen01Icon, label: "나의 여정" },
  { icon: QuillWrite01Icon, label: "서재" },
  { icon: User02Icon, label: "프로필" },
] as const

function WritingPromptCard({ title }: { title: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      className="flex w-full items-center justify-between rounded-[2.25rem] bg-surface-container px-7.5 py-6 text-left transition-colors hover:bg-surface-container-high"
      aria-expanded={expanded}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon
            icon={BookOpen01Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.5}
            className="text-on-surface-low"
          />
          <span className="text-[0.75rem] font-bold tracking-[0.0438rem] text-on-surface-low uppercase">
            Writing Prompt
          </span>
        </div>
        <span className="text-base font-semibold text-on-surface">{title}</span>
      </div>
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        size={24}
        color="currentColor"
        strokeWidth={1.5}
        className={`shrink-0 text-on-surface transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      />
    </button>
  )
}

function QuoteBlock({ content }: { content: string }) {
  return (
    <blockquote className="relative w-full rounded-[3rem] bg-surface px-10 py-12">
      <span
        className="absolute top-[2.556rem] left-4 -translate-y-1/2 font-serif text-[3rem] leading-none text-surface-container-highest select-none"
        aria-hidden="true"
      >
        &ldquo;
      </span>
      <p className="text-[1.25rem] leading-6.5 text-on-surface-low">
        {content}
      </p>
      <span
        className="absolute right-4 bottom-[0.969rem] font-serif text-[3rem] leading-none text-surface-container-highest select-none"
        aria-hidden="true"
      >
        &rdquo;
      </span>
    </blockquote>
  )
}

export default function WritingDetailView({
  data,
}: {
  data: WritingDetailData
}) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-surface px-4 py-3">
        <button
          aria-label="뒤로 가기"
          onClick={() => router.back()}
          className="flex size-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </button>
        <span className="flex-1 text-center text-sm font-semibold text-on-surface">
          {data.title}
        </span>
        <button
          aria-label="더보기"
          className="flex size-10 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-container"
        >
          <HugeiconsIcon
            icon={MoreHorizontalIcon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </button>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-32">
        {/* Title block */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium tracking-[0.022rem] text-on-surface-lowest">
            {data.date}
          </span>
          <h1 className="text-[2.5rem] leading-tight font-medium tracking-[-0.0625rem] text-on-surface">
            {data.title}
          </h1>
        </div>

        {/* Author */}
        <div className="mt-4 text-right">
          <span className="text-base font-medium text-on-surface">
            {data.author}
          </span>
        </div>

        {/* Writing Prompt */}
        {data.prompt && (
          <div className="mt-6">
            <WritingPromptCard title={data.prompt.title} />
          </div>
        )}

        {/* Essay body */}
        <div className="mt-12 flex flex-col gap-12">
          {data.paragraphs.map((block, index) =>
            block.type === "quote" ? (
              <QuoteBlock key={index} content={block.content} />
            ) : (
              <p
                key={index}
                className="text-[1.125rem] leading-[1.956rem] text-on-surface"
              >
                {block.content}
              </p>
            )
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around rounded-tl-[2rem] rounded-tr-[2rem] border-t border-outline/20 bg-surface/95 px-4 py-4 safe-area-pb shadow-[0px_-12px_40px_0px_rgba(47,52,48,0.04)] backdrop-blur-xl">
        {BOTTOM_NAV_ITEMS.map(({ icon, label }) => (
          <button
            key={label}
            className="flex flex-col items-center gap-1 text-on-surface-lowest transition-colors"
          >
            <HugeiconsIcon
              icon={icon}
              size={24}
              color="currentColor"
              strokeWidth={1.5}
            />
            <span className="text-[11px] font-semibold tracking-wide uppercase">
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}
