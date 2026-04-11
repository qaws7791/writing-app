"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { IconButton } from "@workspace/ui/components/icon-button"
import { Button } from "@workspace/ui/components/button"

interface EssayItem {
  id: number
  date: string
  wordCount: number
  title: string
  preview: string
  isOwner: boolean
}

interface PromptDetailData {
  id: number
  title: string
  description: string
  essayCount: number
  essays: EssayItem[]
}

function WordCountBadge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-label-medium-em text-on-surface-low">
      {count.toLocaleString("ko-KR")} 단어
    </span>
  )
}

function EssayListItem({ essay }: { essay: EssayItem }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() =>
        router.push(
          essay.isOwner ? `/writings/${essay.id}/edit` : `/writings/${essay.id}`
        )
      }
      className="flex flex-col gap-4 text-left"
    >
      <div className="flex items-center justify-between">
        <span className="text-label-small text-on-surface-lowest">
          {essay.date}
        </span>
        <WordCountBadge count={essay.wordCount} />
      </div>
      <h3 className="text-title-large-em text-on-surface">{essay.title}</h3>
      <p className="line-clamp-2 text-body-medium text-on-surface-low">
        {essay.preview}
      </p>
    </button>
  )
}

function EmptyEssayList() {
  return (
    <p className="py-10 text-center text-body-large text-on-surface-lowest">
      이 글감에 아직 작성된 글이 없어요. 첫 번째로 써보세요!
    </p>
  )
}

export default function PromptDetailView({
  data,
  hasMoreEssays,
  isLoadingMoreEssays,
  onStartWritingAction,
  onLoadMoreEssaysAction,
}: {
  data: PromptDetailData
  hasMoreEssays: boolean
  isLoadingMoreEssays: boolean
  onStartWritingAction: () => void
  onLoadMoreEssaysAction: () => void
}) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-surface px-4 py-3">
        <IconButton aria-label="뒤로 가기" onClick={() => router.back()}>
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </IconButton>
        <span className="flex-1 text-center text-label-large text-on-surface">
          {data.title}
        </span>
        <IconButton aria-label="더보기">
          <HugeiconsIcon
            icon={MoreHorizontalIcon}
            size={24}
            color="currentColor"
            strokeWidth={1.5}
          />
        </IconButton>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-40">
        {/* Topic Header Section */}
        <div className="flex flex-col gap-6 px-5 pt-4">
          <h1 className="text-headline-large-em text-on-surface">
            {data.title}
          </h1>

          <p className="text-body-large text-on-surface-low opacity-80">
            {data.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-label-medium text-on-surface-lowest uppercase">
                작성된 수필
              </span>
              <span className="text-title-large-em text-on-surface tabular-nums">
                {data.essayCount.toLocaleString("ko-KR")}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 h-px bg-surface-container-high" />

        {/* Essay List */}
        <div className="flex flex-col gap-12 px-5 pt-8 pb-6">
          {data.essays.length === 0 ? (
            <EmptyEssayList />
          ) : (
            data.essays.map((essay) => (
              <EssayListItem key={essay.id} essay={essay} />
            ))
          )}
        </div>

        {/* Load More */}
        {hasMoreEssays && (
          <div className="flex items-center justify-center py-6">
            <Button
              variant="text"
              size="sm"
              onClick={onLoadMoreEssaysAction}
              disabled={isLoadingMoreEssays}
            >
              {isLoadingMoreEssays ? "불러오는 중..." : "더 불러오기"}
            </Button>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="fixed right-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] left-0 z-40 px-4 pb-3">
        <Button
          variant="filled"
          size="lg"
          onClick={onStartWritingAction}
          className="w-full"
        >
          글쓰기 시작
        </Button>
      </div>
    </div>
  )
}
