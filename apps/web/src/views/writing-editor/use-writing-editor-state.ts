"use client"

import { useCallback, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "@workspace/ui/components/ui/sonner"

import { appendReturnTo, navigateBack } from "@/foundation/navigation"
import { formatLongKoreanDate } from "@/foundation/utils"
import { usePromptDetail } from "@/features/prompts/hooks/use-prompt-detail"
import { useWritingDetail } from "@/features/writings"
import { useDirtyGuard } from "./use-dirty-guard"
import { useWritingEditor } from "./use-writing-editor"
import { useWritingPersistence } from "./use-writing-persistence"

export function useWritingEditorState({
  promptId,
  writingId,
}: {
  promptId?: number
  writingId?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [today] = useState(() => new Date())
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [promptCollapsed, setPromptCollapsed] = useState(false)
  const [showPromptSheet, setShowPromptSheet] = useState(false)
  const [sheetPromptId, setSheetPromptId] = useState<number | undefined>(
    undefined
  )

  const writingIdNumber = writingId ? Number(writingId) : undefined
  const effectivePromptId = sheetPromptId ?? promptId
  const fallbackPath = writingIdNumber ? "/writings" : "/writings/new"
  const returnTo = searchParams.get("returnTo")
  const writingQuery = useWritingDetail(writingIdNumber)
  const {
    editor,
    handleTitleChange,
    isDirty,
    setIsDirty,
    title,
    titleRef,
    wordCount,
  } = useWritingEditor(writingQuery.data ?? null)
  const promptQuery = usePromptDetail(effectivePromptId)
  const { isSaving, remove, save } = useWritingPersistence({
    editor,
    effectivePromptId,
    title,
    writingIdNumber,
    onSaved: () => setIsDirty(false),
  })

  const isPromptEnabled = effectivePromptId != null
  const prompt =
    isPromptEnabled && promptQuery.data != null ? promptQuery.data : null
  const isPromptLoading = isPromptEnabled && promptQuery.isLoading

  useDirtyGuard(isDirty)

  const navigateAfterSave = useCallback(
    (savedId: number | undefined) => {
      if (savedId != null) {
        router.push(appendReturnTo(`/writings/${savedId}`, returnTo ?? ""))
        return
      }

      navigateBack(router, {
        returnTo,
        fallbackPath,
      })
    },
    [fallbackPath, returnTo, router]
  )

  const handleSave = useCallback(async () => {
    navigateAfterSave(await save())
  }, [navigateAfterSave, save])

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowLeaveDialog(true)
      return
    }

    navigateBack(router, {
      returnTo,
      fallbackPath,
    })
  }, [fallbackPath, isDirty, returnTo, router])

  const handleLeaveWithoutSave = useCallback(() => {
    setShowLeaveDialog(false)
    setIsDirty(false)
    navigateBack(router, {
      returnTo,
      fallbackPath,
    })
  }, [fallbackPath, returnTo, router, setIsDirty])

  const handleSaveAndLeave = useCallback(async () => {
    setShowLeaveDialog(false)
    try {
      navigateAfterSave(await save())
    } catch {
      setShowLeaveDialog(true)
      toast.error("저장에 실패했습니다.")
    }
  }, [navigateAfterSave, save])

  const handleDelete = useCallback(async () => {
    await remove()
    router.replace("/writings")
  }, [remove, router])

  const handleSelectPrompt = useCallback((selectedPromptId: number) => {
    setSheetPromptId(selectedPromptId)
    setShowPromptSheet(false)
  }, [])

  return {
    dateLabel: formatLongKoreanDate(today),
    editor,
    handleBack,
    handleDelete,
    handleLeaveWithoutSave,
    handleSave,
    handleSaveAndLeave,
    handleSelectPrompt,
    handleTitleChange,
    isPromptLoading,
    isSaving,
    prompt,
    promptCollapsed,
    setPromptCollapsed,
    setShowLeaveDialog,
    setShowPromptSheet,
    showLeaveDialog,
    showPromptSheet,
    title,
    titleRef,
    wordCount,
    writingIdNumber,
  }
}
