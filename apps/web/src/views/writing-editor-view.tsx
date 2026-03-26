"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { WritingEditorBody } from "@/features/writing/components/writing-editor-body"
import { WritingEditorDialogs } from "@/features/writing/components/writing-editor-dialogs"
import { WritingEditorHeader } from "@/features/writing/components/writing-editor-header"
import { useWritingDetailQuery } from "@/features/writing/hooks/use-writing-detail-query"
import { useWritingPromptQuery } from "@/features/writing/hooks/use-writing-prompt-query"
import { useEditorWriting } from "@/features/writing/hooks/use-editor-writing"
import { useWritingAutosave } from "@/features/writing/hooks/use-writing-autosave"
import { useDeleteWritingMutation } from "@/features/writing/hooks/use-delete-writing-mutation"
import { useSaveVersionMutation } from "@/features/writing/hooks/use-save-version-mutation"
import { useEditorLeaveGuard } from "@/features/writing/hooks/use-editor-leave-guard"
import type { VersionDetail } from "@/features/writing/sync/types"

import styles from "@/features/writing/components/writing-editor-page.module.css"

export type WritingEditorViewProps = {
  writingId: number
}

export default function WritingEditorView({
  writingId,
}: WritingEditorViewProps) {
  const router = useRouter()
  const pathname = usePathname()

  // --- Server State ---
  const writingQuery = useWritingDetailQuery(writingId)
  const promptQuery = useWritingPromptQuery(
    writingId,
    writingQuery.data?.sourcePromptId ?? null
  )

  // --- Editor State ---
  const {
    editorWriting,
    editorWritingRef,
    getContent,
    handleContentChange,
    handleTitleInput,
    hasPendingChanges,
    lastSyncedSnapshotRef,
    markSynced,
    restoreFromVersion,
    titleRef,
  } = useEditorWriting({ writingDetail: writingQuery.data, writingId })

  // --- Autosave ---
  const { flushPendingWriting, markSaved, syncState } = useWritingAutosave({
    writingId,
    editorWritingRef,
    isReady: writingQuery.data !== undefined,
    lastSyncedSnapshotRef,
    markSynced,
  })

  // --- Navigation Guard ---
  const {
    cancelPendingNavigation,
    confirmPendingNavigation,
    isLeaveConfirmOpen,
  } = useEditorLeaveGuard({
    flushPendingWriting,
    hasPendingChanges,
    navigate: (href) => router.push(href),
    pathname,
  })

  // --- Mutations ---
  const deleteMutation = useDeleteWritingMutation()
  const saveVersionMutation = useSaveVersionMutation()

  // --- Dialog States ---
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [versionHistoryModalOpen, setVersionHistoryModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // --- Handlers ---
  const handleShare = async () => {
    const { bodyText, title } = getContent()
    const text = [title, bodyText].filter(Boolean).join("\n\n")

    if (!navigator.share) {
      await navigator.clipboard.writeText(text)
      return
    }

    try {
      await navigator.share({
        text,
        title: title || "제목 없음",
      })
    } catch {
      await navigator.clipboard.writeText(text)
    }
  }

  const handleDelete = async () => {
    if (writingQuery.data) {
      await deleteMutation.mutateAsync(writingQuery.data.id)
    }
    router.push("/writing")
  }

  const handleSaveVersion = async () => {
    await flushPendingWriting()
    const current = editorWritingRef.current

    try {
      await saveVersionMutation.mutateAsync({
        writingId,
        title: current.title,
        content: current.content,
      })
    } catch {
      // 저장 실패는 무시 — 다음 자동 저장에서 재시도
    }
  }

  const handleRestoreComplete = (detail: VersionDetail) => {
    restoreFromVersion(detail)
    markSaved()
  }

  return (
    <div
      data-writing-editor-page=""
      className={`${styles.page} flex min-h-0 flex-1 flex-col bg-background text-foreground`}
    >
      <WritingEditorHeader
        editorTitle={editorWriting.title}
        loading={writingQuery.isLoading}
        onDeleteClick={() => setDeleteDialogOpen(true)}
        onExportClick={() => setExportModalOpen(true)}
        onSaveVersion={() => void handleSaveVersion()}
        onShare={handleShare}
        onVersionHistoryClick={() => setVersionHistoryModalOpen(true)}
        persistedWriting={writingQuery.data ?? null}
        syncState={syncState}
      />

      <WritingEditorBody
        editorWriting={editorWriting}
        loadError={
          writingQuery.error
            ? "글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
            : null
        }
        onContentChange={handleContentChange}
        onTitleInput={handleTitleInput}
        prompt={promptQuery.data ?? null}
        titleRef={titleRef}
      />

      <WritingEditorDialogs
        cancelPendingNavigation={cancelPendingNavigation}
        confirmPendingNavigation={confirmPendingNavigation}
        deleteDialogOpen={deleteDialogOpen}
        writingId={writingId}
        exportModalOpen={exportModalOpen}
        getContent={getContent}
        isLeaveConfirmOpen={isLeaveConfirmOpen}
        onDelete={handleDelete}
        onDeleteDialogOpenChange={setDeleteDialogOpen}
        onExportModalOpenChange={setExportModalOpen}
        onRestoreComplete={handleRestoreComplete}
        onVersionHistoryModalOpenChange={setVersionHistoryModalOpen}
        versionHistoryModalOpen={versionHistoryModalOpen}
      />
    </div>
  )
}
