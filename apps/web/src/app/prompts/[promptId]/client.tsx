"use client"

import { useRouter } from "next/navigation"
import PromptDetailView from "@/views/prompt-detail-view"
import { usePromptDetail, usePromptWritings } from "@/features/prompts"
import { formatShortDate } from "@/foundation/utils"

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
    date: formatShortDate(item.createdAt),
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
