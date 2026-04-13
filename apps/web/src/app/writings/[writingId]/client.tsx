"use client"

import { useMemo } from "react"

import { usePromptDetail } from "@/features/prompts"
import { useUserProfile } from "@/features/users"
import {
  useCompareWritingRevision,
  useGenerateWritingFeedback,
  useWritingDetail,
} from "@/features/writings"
import WritingDetailView from "@/views/writing-detail-view"

export default function WritingDetailClientPage({
  writingId,
}: {
  writingId: string
}) {
  const writingIdNumber = Number(writingId)
  const writingQuery = useWritingDetail(writingIdNumber)
  const profileQuery = useUserProfile()
  const feedbackMutation = useGenerateWritingFeedback()
  const compareMutation = useCompareWritingRevision()

  const sourcePromptId = writingQuery.data?.sourcePromptId ?? undefined
  const promptQuery = usePromptDetail(sourcePromptId ?? undefined)

  const paragraphs = useMemo(() => {
    const body = writingQuery.data?.bodyPlainText ?? ""
    if (!body.trim()) {
      return []
    }

    return body
      .split(/\n\s*\n/g)
      .map((content) => ({
        type: "paragraph" as const,
        content: content.trim(),
      }))
      .filter((block) => block.content.length > 0)
  }, [writingQuery.data?.bodyPlainText])

  if (!Number.isFinite(writingIdNumber) || writingIdNumber <= 0) {
    return null
  }

  if (writingQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6 text-sm text-muted">
        글을 불러오고 있어요...
      </div>
    )
  }

  if (writingQuery.isError || !writingQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6 text-sm text-muted">
        글 정보를 불러오지 못했어요.
      </div>
    )
  }

  return (
    <WritingDetailView
      comparison={compareMutation.data}
      comparisonPending={compareMutation.isPending}
      data={{
        id: String(writingQuery.data.id),
        title: writingQuery.data.title || "제목 없음",
        date: new Date(writingQuery.data.createdAt).toLocaleDateString(
          "ko-KR",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          }
        ),
        author: profileQuery.data?.name ?? "나",
        prompt:
          sourcePromptId != null && promptQuery.data
            ? {
                id: String(promptQuery.data.id),
                title: promptQuery.data.title,
              }
            : undefined,
        paragraphs,
      }}
      feedback={feedbackMutation.data}
      feedbackPending={feedbackMutation.isPending}
      onCompareRevision={(revisedText) =>
        compareMutation.mutateAsync({
          writingId: writingIdNumber,
          originalText: writingQuery.data.bodyPlainText,
          revisedText,
        })
      }
      onGenerateFeedback={() =>
        feedbackMutation.mutateAsync({
          writingId: writingIdNumber,
          level: "beginner",
        })
      }
    />
  )
}
