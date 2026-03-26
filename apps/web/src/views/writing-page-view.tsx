"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { WritingPageBody } from "@/features/writing/components/writing-page-body"
import { WritingPageDialogs } from "@/features/writing/components/writing-page-dialogs"
import { WritingPageHeader } from "@/features/writing/components/writing-page-header"
import { useDraftDetailQuery } from "@/features/writing/hooks/use-draft-detail-query"
import { useDraftPromptQuery } from "@/features/writing/hooks/use-draft-prompt-query"
import { useEditorDraft } from "@/features/writing/hooks/use-editor-draft"
import { useDraftAutosave } from "@/features/writing/hooks/use-draft-autosave"
import { useDeleteDraftMutation } from "@/features/writing/hooks/use-delete-draft-mutation"
import { useSaveVersionMutation } from "@/features/writing/hooks/use-save-version-mutation"
import { useEditorLeaveGuard } from "@/features/writing/hooks/use-editor-leave-guard"
import type { VersionDetail } from "@/features/writing/sync/types"

import styles from "@/features/writing/components/write-editor-page.module.css"

export type WritingPageProps = {
  draftId: number
}

export default function WritingPageView({ draftId }: WritingPageProps) {
  const router = useRouter()
  const pathname = usePathname()

  // --- Server State ---
  const draftQuery = useDraftDetailQuery(draftId)
  const promptQuery = useDraftPromptQuery(
    draftId,
    draftQuery.data?.sourcePromptId ?? null
  )

  // --- Editor State ---
  const {
    editorDraft,
    editorDraftRef,
    getContent,
    handleContentChange,
    handleTitleInput,
    hasPendingChanges,
    lastSyncedSnapshotRef,
    markSynced,
    restoreFromVersion,
    titleRef,
  } = useEditorDraft({ draftDetail: draftQuery.data, draftId })

  // --- Autosave ---
  const { flushPendingDraft, markSaved, syncState } = useDraftAutosave({
    draftId,
    editorDraftRef,
    isReady: draftQuery.data !== undefined,
    lastSyncedSnapshotRef,
    markSynced,
  })

  // --- Navigation Guard ---
  const {
    cancelPendingNavigation,
    confirmPendingNavigation,
    isLeaveConfirmOpen,
  } = useEditorLeaveGuard({
    flushPendingDraft,
    hasPendingChanges,
    navigate: (href) => router.push(href),
    pathname,
  })

  // --- Mutations ---
  const deleteMutation = useDeleteDraftMutation()
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
    if (draftQuery.data) {
      await deleteMutation.mutateAsync(draftQuery.data.id)
    }
    router.push("/write")
  }

  const handleSaveVersion = async () => {
    await flushPendingDraft()
    const current = editorDraftRef.current

    try {
      await saveVersionMutation.mutateAsync({
        draftId,
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
      <WritingPageHeader
        editorTitle={editorDraft.title}
        loading={draftQuery.isLoading}
        onDeleteClick={() => setDeleteDialogOpen(true)}
        onExportClick={() => setExportModalOpen(true)}
        onSaveVersion={() => void handleSaveVersion()}
        onShare={handleShare}
        onVersionHistoryClick={() => setVersionHistoryModalOpen(true)}
        persistedDraft={draftQuery.data ?? null}
        syncState={syncState}
      />

      <WritingPageBody
        editorDraft={editorDraft}
        loadError={
          draftQuery.error
            ? "초안을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
            : null
        }
        onContentChange={handleContentChange}
        onTitleInput={handleTitleInput}
        prompt={promptQuery.data ?? null}
        titleRef={titleRef}
      />

      <WritingPageDialogs
        cancelPendingNavigation={cancelPendingNavigation}
        confirmPendingNavigation={confirmPendingNavigation}
        deleteDialogOpen={deleteDialogOpen}
        draftId={draftId}
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
