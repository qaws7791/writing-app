"use client"

import { WritingPageBody } from "./writing-page-body"
import { WritingPageDialogs } from "./writing-page-dialogs"
import { WritingPageHeader } from "./writing-page-header"
import { type WritingPageProps, useWritingPage } from "./use-writing-page"

import styles from "../write-editor-page.module.css"

export default function WritingPageClient(props: WritingPageProps) {
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
  } = useWritingPage(props)

  return (
    <div
      data-writing-editor-page=""
      className={`${styles.page} flex min-h-0 flex-1 flex-col bg-background text-foreground`}
    >
      <WritingPageHeader
        editorTitle={editorDraft.title}
        loading={loading}
        onDeleteClick={() => setDeleteDialogOpen(true)}
        onExportClick={() => setExportModalOpen(true)}
        onShare={handleShare}
        onVersionHistoryClick={() => setVersionHistoryModalOpen(true)}
        persistedDraft={persistedDraft}
        syncState={syncState}
      />

      <WritingPageBody
        editorDraft={editorDraft}
        loadError={loadError}
        onContentChange={handleContentChange}
        onTitleInput={handleTitleInput}
        prompt={prompt}
        titleRef={titleRef}
      />

      <WritingPageDialogs
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
