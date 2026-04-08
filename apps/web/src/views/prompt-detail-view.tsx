"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  MoreHorizontalIcon,
  Home01Icon,
  BookOpen01Icon,
  QuillWrite01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"

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

const BOTTOM_NAV_ITEMS = [
  { icon: Home01Icon, label: "홈" },
  { icon: BookOpen01Icon, label: "나의 여정" },
  { icon: QuillWrite01Icon, label: "서재" },
  { icon: User02Icon, label: "프로필" },
] as const

function WordCountBadge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-semibold text-on-surface-low">
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
        <span className="text-sm font-medium tracking-wide text-on-surface-lowest">
          {essay.date}
        </span>
        <WordCountBadge count={essay.wordCount} />
      </div>
      <h3 className="text-2xl leading-snug font-medium tracking-tight text-on-surface">
        {essay.title}
      </h3>
      <p className="line-clamp-2 text-base leading-relaxed text-on-surface-low">
        {essay.preview}
      </p>
    </button>
  )
}

function EmptyEssayList() {
  return (
    <p className="py-10 text-center text-base text-on-surface-lowest">
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
      <div className="flex-1 overflow-y-auto pb-40">
        {/* Topic Header Section */}
        <div className="flex flex-col gap-6 px-5 pt-4">
          <h1 className="text-[2.5rem] leading-tight font-medium tracking-[-0.05em] text-on-surface">
            {data.title}
          </h1>

          <p className="text-lg leading-relaxed text-on-surface-low opacity-80">
            {data.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium tracking-widest text-on-surface-lowest uppercase">
                작성된 수필
              </span>
              <span className="text-xl font-semibold text-on-surface tabular-nums">
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
            <button
              onClick={onLoadMoreEssaysAction}
              disabled={isLoadingMoreEssays}
              className="rounded-[3rem] px-6 py-3 text-xs font-bold tracking-wide text-on-surface-low uppercase transition-colors hover:bg-surface-container disabled:opacity-50"
            >
              {isLoadingMoreEssays ? "불러오는 중..." : "더 불러오기"}
            </button>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="fixed right-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] left-0 z-40 px-4 pb-3">
        <button
          onClick={onStartWritingAction}
          className="w-full rounded-[1rem] bg-primary py-4 text-base font-semibold text-on-primary transition-opacity hover:opacity-90 active:opacity-75"
        >
          글쓰기 시작
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around rounded-tl-[2rem] rounded-tr-[2rem] border-t border-outline/20 bg-surface/95 px-4 py-4 safe-area-pb shadow-[0px_-12px_40px_0px_rgba(47,52,48,0.04)] backdrop-blur-xl">
        {BOTTOM_NAV_ITEMS.map(({ icon, label }) => (
          <button
            key={label}
            onClick={() => router.push("/home")}
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
