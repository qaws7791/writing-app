"use client"

import { WritingNewPageBody } from "./writing-new-page-body"
import { WritingNewPageDialogs } from "./writing-new-page-dialogs"
import { WritingNewPageHeader } from "./writing-new-page-header"
import {
  type WritingNewPageClientProps,
  useWritingNewPage,
} from "./use-writing-new-page"

import styles from "../write-editor-page.module.css"

export default function WritingNewPageClient(props: WritingNewPageClientProps) {
  const {
    cancelPendingNavigation,
    confirmPendingNavigation,
    deleteDialogOpen,
    editorDraft,
    exportModalOpen,
    getContent,
    handleContentChange,
    handleDelete,
    handleShare,
    handleTitleInput,
    isLeaveConfirmOpen,
    loadError,
    loading,
    persistedDraft,
    prompt,
    setDeleteDialogOpen,
    setExportModalOpen,
    setVersionHistoryModalOpen,
    syncState,
    titleRef,
    versionHistoryModalOpen,
  } = useWritingNewPage(props)

  return (
    <div
      data-writing-editor-page=""
      className={`${styles.page} flex min-h-0 flex-1 flex-col bg-background text-foreground`}
    >
      <WritingNewPageHeader
        editorTitle={editorDraft.title}
        loading={loading}
        onDeleteClick={() => setDeleteDialogOpen(true)}
        onExportClick={() => setExportModalOpen(true)}
        onShare={handleShare}
        onVersionHistoryClick={() => setVersionHistoryModalOpen(true)}
        persistedDraft={persistedDraft}
        syncState={syncState}
      />

      <WritingNewPageBody
        editorDraft={editorDraft}
        loadError={loadError}
        onContentChange={handleContentChange}
        onTitleInput={handleTitleInput}
        prompt={prompt}
        titleRef={titleRef}
      />

      <WritingNewPageDialogs
        cancelPendingNavigation={cancelPendingNavigation}
        confirmPendingNavigation={confirmPendingNavigation}
        deleteDialogOpen={deleteDialogOpen}
        exportModalOpen={exportModalOpen}
        getContent={getContent}
        isLeaveConfirmOpen={isLeaveConfirmOpen}
        onDelete={handleDelete}
        onDeleteDialogOpenChange={setDeleteDialogOpen}
        onExportModalOpenChange={setExportModalOpen}
        onVersionHistoryModalOpenChange={setVersionHistoryModalOpen}
        versionHistoryModalOpen={versionHistoryModalOpen}
      />
    </div>
  )
}
