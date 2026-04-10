"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  MoreVerticalIcon,
  QuillWrite01Icon,
  Delete01Icon,
} from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { useWritings, useDeleteWriting } from "@/features/writings"

interface WritingSummary {
  id: number
  date: string
  title: string
  excerpt: string
  wordCount: number
}

function WritingCard({
  writing,
  onDelete,
}: {
  writing: WritingSummary
  onDelete: (id: number) => void
}) {
  const router = useRouter()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/writings/${writing.id}/edit`)}
      onKeyDown={(e) =>
        e.key === "Enter" && router.push(`/writings/${writing.id}/edit`)
      }
      className="flex cursor-pointer flex-col gap-4 rounded-[2.25rem] bg-surface-container p-8 text-left transition-colors hover:bg-surface-container-high"
    >
      <div className="flex items-center justify-between">
        <span className="text-label-large text-on-surface-low">
          {writing.date}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="더보기"
                className="flex h-10 w-10 items-center justify-center text-on-surface-low"
                onClick={(e) => e.stopPropagation()}
              >
                <HugeiconsIcon
                  icon={MoreVerticalIcon}
                  size={16}
                  color="currentColor"
                  strokeWidth={2}
                />
              </button>
            }
          ></DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="end"
            className="min-w-32.5 rounded-2xl bg-surface-container-low px-0 py-1 shadow-[0px_4px_8px_3px_rgba(0,0,0,0.15),0px_1px_3px_0px_rgba(0,0,0,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              className="gap-3 px-3 py-3 text-label-large text-on-surface-low"
              onClick={() => onDelete(writing.id)}
            >
              <HugeiconsIcon
                icon={Delete01Icon}
                size={20}
                color="currentColor"
                strokeWidth={1.5}
              />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <h2 className="text-headline-small-em text-on-surface">
        {writing.title}
      </h2>
      <p className="line-clamp-2 text-body-large text-on-surface-low">
        {writing.excerpt}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-on-surface-low" aria-hidden="true">
          ≡
        </span>
        <span className="text-label-small-em tracking-[1.1px] text-on-surface-low uppercase">
          {writing.wordCount.toLocaleString()} 단어
        </span>
      </div>
    </div>
  )
}

export default function WritingsListView() {
  const router = useRouter()
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useWritings()
  const deleteWriting = useDeleteWriting()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const writings: WritingSummary[] =
    data?.pages.flatMap((page) =>
      page.items.map((item) => ({
        id: item.id as unknown as number,
        date: new Date(item.updatedAt).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        title: item.title || "제목 없음",
        excerpt: item.preview,
        wordCount: item.wordCount,
      }))
    ) ?? []

  return (
    <div className="relative flex flex-col bg-surface">
      {/* Header */}
      <div className="px-4 pt-4 pb-0">
        <h1 className="text-headline-small-em text-on-surface">글쓰기</h1>
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
          <span className="text-body-large text-on-surface-lowest">
            기록된 생각을 검색해보세요
          </span>
        </div>
      </div>

      {/* Writing Cards */}
      <div className="flex flex-col gap-5 px-2 pt-5 pb-8">
        {writings.map((writing) => (
          <WritingCard
            key={writing.id}
            writing={writing}
            onDelete={(id) => deleteWriting.mutate(id)}
          />
        ))}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <span className="text-body-medium text-on-surface-low">
              불러오는 중...
            </span>
          </div>
        )}
        <div ref={sentinelRef} />
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
