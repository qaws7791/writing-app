"use client"

import { Search, PenLine } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { Button } from "@workspace/ui/components/ui/button"
import { Spinner } from "@workspace/ui/components/ui/spinner"

import { appendReturnTo } from "@/foundation/navigation"
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
        id: item.id as number,
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
    <div className="relative flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 pt-4 pb-0">
        <h1 className="text-xl leading-snug font-semibold text-foreground">
          글쓰기
        </h1>
      </div>

      {/* Search Bar */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2.5 rounded-[2rem] bg-muted px-6 py-5">
          <Search
            size={18}
            strokeWidth={1.5}
            className="shrink-0 text-muted-foreground/80"
          />
          <span className="text-base leading-7 text-muted-foreground/80">
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
            <Spinner />
          </div>
        )}
        <div ref={sentinelRef} />
      </div>

      {/* FAB */}
      <div className="fixed right-4 bottom-24 z-50">
        <Button
          size="icon-lg"
          variant="default"
          aria-label="새 글쓰기"
          className="rounded-full shadow-lg"
          onClick={() =>
            router.push(appendReturnTo("/writings/new", "/writings"))
          }
        >
          <PenLine size={24} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  )
}
