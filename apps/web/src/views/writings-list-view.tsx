"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, QuillWrite01Icon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import { useWritings, useDeleteWriting } from "@/features/writings"
import { WritingCard } from "@/features/writings/components"
import type { WritingCardData } from "@/features/writings/components"

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

  const writings: WritingCardData[] =
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
        <h1 className="text-xl leading-snug font-semibold text-foreground">
          글쓰기
        </h1>
      </div>

      {/* Search Bar */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2.5 rounded-[2rem] bg-surface-secondary px-6 py-5">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.5}
            className="shrink-0 text-muted/80"
          />
          <span className="text-base leading-7 text-muted/80">
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
            <Spinner size="sm" />
          </div>
        )}
        <div ref={sentinelRef} />
      </div>

      {/* FAB */}
      <Button
        isIconOnly
        variant="primary"
        size="lg"
        aria-label="새 글쓰기"
        className="fixed right-4 bottom-24 rounded-full shadow-lg"
        onPress={() => router.push("/writings/new")}
      >
        <HugeiconsIcon
          icon={QuillWrite01Icon}
          size={24}
          color="currentColor"
          strokeWidth={1.5}
        />
      </Button>
    </div>
  )
}
