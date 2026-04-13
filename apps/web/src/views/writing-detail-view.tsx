"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  MoreHorizontalIcon,
  BookOpen01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { TextField } from "@workspace/ui/components/text-field"
import { TextArea } from "@workspace/ui/components/textarea"

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

function WritingPromptCard({ title }: { title: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card.Root>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-7.5 py-6 text-left"
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
          className={`text-on-surface shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
    </Card.Root>
  )
}

function QuoteBlock({ content }: { content: string }) {
  return (
    <blockquote className="relative w-full rounded-[3rem] bg-surface px-10 py-12">
      <span
        className="text-surface-container-highest absolute top-[2.556rem] left-4 -translate-y-1/2 font-serif text-[3rem] leading-none select-none"
        aria-hidden="true"
      >
        &ldquo;
      </span>
      <p className="text-title-large text-on-surface-low">{content}</p>
      <span
        className="text-surface-container-highest absolute right-4 bottom-[0.969rem] font-serif text-[3rem] leading-none select-none"
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
        <Button
          isIconOnly
          variant="ghost"
          aria-label="뒤로 가기"
          onPress={() => router.back()}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </Button>
        <span className="text-label-large text-on-surface flex-1 text-center">
          {data.title}
        </span>
        <Button isIconOnly variant="ghost" aria-label="더보기">
          <HugeiconsIcon
            icon={MoreHorizontalIcon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </Button>
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
            <WritingPromptCard title={data.prompt.title} />
          </div>
        )}

        <div className="bg-surface-container mt-8 flex flex-col gap-4 rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-title-medium-em text-on-surface">
                AI 피드백
              </h2>
              <p className="text-body-medium text-on-surface-low mt-1">
                현재 글을 기준으로 강점과 개선점을 받아볼 수 있어요.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onPress={() => void onGenerateFeedback?.()}
              isDisabled={feedbackPending}
            >
              {feedbackPending ? "생성 중..." : "피드백 받기"}
            </Button>
          </div>

          {feedback ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-label-large-em text-on-surface">강점</p>
                <ul className="text-body-medium text-on-surface-low mt-2 flex list-disc flex-col gap-2 pl-5">
                  {feedback.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-label-large-em text-on-surface">개선점</p>
                <ul className="text-body-medium text-on-surface-low mt-2 flex list-disc flex-col gap-2 pl-5">
                  {feedback.improvements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="text-body-medium text-on-surface-low rounded-2xl bg-surface px-4 py-3">
                {feedback.question}
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-surface-container mt-6 flex flex-col gap-4 rounded-[2rem] p-6">
          <div>
            <h2 className="text-title-medium-em text-on-surface">
              수정본 비교
            </h2>
            <p className="text-body-medium text-on-surface-low mt-1">
              수정한 버전을 붙여 넣으면 원문과 비교해 개선 지점을 알려줘요.
            </p>
          </div>
          <TextField value={revisedText} onChange={setRevisedText}>
            <TextArea
              placeholder="수정한 버전을 여기에 붙여 넣어주세요."
              className="min-h-40"
            />
          </TextField>
          <Button
            variant="primary"
            onPress={() => void onCompareRevision?.(revisedText)}
            isDisabled={comparisonPending || revisedText.trim().length === 0}
          >
            {comparisonPending ? "비교 중..." : "수정본 비교하기"}
          </Button>

          {comparison ? (
            <div className="flex flex-col gap-4 rounded-[1.5rem] bg-surface px-4 py-4">
              <p className="text-label-large-em text-on-surface">요약</p>
              <p className="text-body-medium text-on-surface-low leading-relaxed">
                {comparison.summary}
              </p>
              <ul className="text-body-medium text-on-surface-low flex list-disc flex-col gap-2 pl-5">
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
    </div>
  )
}
