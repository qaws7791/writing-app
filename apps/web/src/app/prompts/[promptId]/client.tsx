"use client"

import { useRouter } from "next/navigation"
import PromptDetailView from "@/views/prompt-detail-view"
import { usePromptDetail, usePromptWritings } from "@/features/prompts"

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`
}

export default function PromptDetailClientPage({
  promptId,
}: {
  promptId: number
}) {
  const router = useRouter()
  const { data: prompt } = usePromptDetail(promptId)
  const { writings, hasNextPage, isFetchingNextPage, fetchNextPage } =
    usePromptWritings(promptId)

  const essays = writings.map((item) => ({
    id: item.id,
    date: formatDate(item.createdAt),
    wordCount: item.wordCount,
    title: item.title,
    preview: item.preview,
    isOwner: item.isOwner,
  }))

  function handleStartWriting() {
    router.push(`/writings/new?promptId=${promptId}`)
  }

  return (
    <PromptDetailView
      data={{
        id: promptId,
        title: prompt?.title ?? "",
        description: prompt?.body ?? "",
        essayCount: prompt?.responseCount ?? 0,
        essays,
      }}
      hasMoreEssays={hasNextPage}
      isLoadingMoreEssays={isFetchingNextPage}
      onStartWritingAction={handleStartWriting}
      onLoadMoreEssaysAction={() => fetchNextPage()}
    />
  )
}
