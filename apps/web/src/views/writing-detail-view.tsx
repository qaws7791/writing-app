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

interface WritingFeedbackData {
  strengths: string[]
  improvements: string[]
  question: string
}

interface WritingComparisonData {
  improvements: string[]
  summary: string
}

const BOTTOM_NAV_ITEMS = [
  { icon: Home01Icon, label: "홈", href: "/home" },
  { icon: BookOpen01Icon, label: "나의 여정", href: "/my-journeys" },
  { icon: QuillWrite01Icon, label: "서재", href: "/library" },
  { icon: User02Icon, label: "프로필", href: "/profile" },
] as const

function WritingPromptCard({
  title,
  promptId,
}: {
  title: string
  promptId?: string
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex flex-col gap-2">
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
            <span className="text-label-large text-on-surface-low uppercase">
              Writing Prompt
            </span>
          </div>
          <span className="text-title-medium-em text-on-surface">{title}</span>
        </div>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={24}
          color="currentColor"
          strokeWidth={1.5}
          className={`shrink-0 text-on-surface transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && promptId && (
        <button
          type="button"
          onClick={() => router.push(`/prompts/${promptId}`)}
          className="self-end px-4 text-label-large-em text-on-surface-low transition-colors hover:text-on-surface"
        >
          글감 보기 →
        </button>
      )}
    </div>
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
  feedback,
  feedbackPending = false,
  comparison,
  comparisonPending = false,
  onGenerateFeedback,
  onCompareRevision,
}: {
  data: WritingDetailData
  feedback?: WritingFeedbackData
  feedbackPending?: boolean
  comparison?: WritingComparisonData
  comparisonPending?: boolean
  onGenerateFeedback?: () => Promise<unknown>
  onCompareRevision?: (revisedText: string) => Promise<unknown>
}) {
  const router = useRouter()
  const [revisedText, setRevisedText] = useState("")

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
        <span className="flex-1 text-center text-label-large text-on-surface">
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
          <span className="text-label-large text-on-surface-lowest">
            {data.date}
          </span>
          <h1 className="text-headline-large-em text-on-surface">
            {data.title}
          </h1>
        </div>

        {/* Author */}
        <div className="mt-4 text-right">
          <span className="text-title-small text-on-surface">
            {data.author}
          </span>
        </div>

        {/* Writing Prompt */}
        {data.prompt && (
          <div className="mt-6">
            <WritingPromptCard
              title={data.prompt.title}
              promptId={data.prompt.id}
            />
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 rounded-[2rem] bg-surface-container p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-title-medium-em text-on-surface">
                AI 피드백
              </h2>
              <p className="mt-1 text-body-medium text-on-surface-low">
                현재 글을 기준으로 강점과 개선점을 받아볼 수 있어요.
              </p>
            </div>
            <button
              onClick={() => void onGenerateFeedback?.()}
              disabled={feedbackPending}
              className="rounded-full bg-on-surface px-4 py-2 text-label-large-em text-surface disabled:opacity-50"
            >
              {feedbackPending ? "생성 중..." : "피드백 받기"}
            </button>
          </div>

          {feedback ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-label-large-em text-on-surface">강점</p>
                <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-body-medium text-on-surface-low">
                  {feedback.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-label-large-em text-on-surface">개선점</p>
                <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-body-medium text-on-surface-low">
                  {feedback.improvements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-surface px-4 py-3 text-body-medium text-on-surface-low">
                {feedback.question}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-[2rem] bg-surface-container p-6">
          <div>
            <h2 className="text-title-medium-em text-on-surface">
              수정본 비교
            </h2>
            <p className="mt-1 text-body-medium text-on-surface-low">
              수정한 버전을 붙여 넣으면 원문과 비교해 개선 지점을 알려줘요.
            </p>
          </div>
          <textarea
            value={revisedText}
            onChange={(event) => setRevisedText(event.target.value)}
            placeholder="수정한 버전을 여기에 붙여 넣어주세요."
            className="min-h-40 rounded-[1.5rem] bg-surface px-4 py-4 text-body-medium text-on-surface outline-none"
          />
          <button
            onClick={() => void onCompareRevision?.(revisedText)}
            disabled={comparisonPending || revisedText.trim().length === 0}
            className="rounded-full bg-on-surface px-4 py-3 text-label-large-em text-surface disabled:opacity-50"
          >
            {comparisonPending ? "비교 중..." : "수정본 비교하기"}
          </button>

          {comparison ? (
            <div className="flex flex-col gap-4 rounded-[1.5rem] bg-surface px-4 py-4">
              <p className="text-label-large-em text-on-surface">요약</p>
              <p className="leading-relaxed text-body-medium text-on-surface-low">
                {comparison.summary}
              </p>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-body-medium text-on-surface-low">
                {comparison.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Essay body */}
        <div className="mt-12 flex flex-col gap-12">
          {data.paragraphs.map((block, index) =>
            block.type === "quote" ? (
              <QuoteBlock key={index} content={block.content} />
            ) : (
              <p key={index} className="text-body-large text-on-surface">
                {block.content}
              </p>
            )
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around rounded-tl-[2rem] rounded-tr-[2rem] border-t border-outline/20 bg-surface/95 px-4 py-4 safe-area-pb shadow-[0px_-12px_40px_0px_rgba(47,52,48,0.04)] backdrop-blur-xl">
        {BOTTOM_NAV_ITEMS.map(({ icon, label, href }) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            className="flex flex-col items-center gap-1 text-on-surface-lowest transition-colors"
          >
            <HugeiconsIcon
              icon={icon}
              size={24}
              color="currentColor"
              strokeWidth={1.5}
            />
            <span className="text-label-medium-em uppercase">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
