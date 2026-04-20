"use client"

import PromptBottomSheet from "@/views/prompt-bottom-sheet"
import { LeaveConfirmDialog } from "@/views/writing-editor/leave-confirm-dialog"
import { useWritingEditorState } from "@/views/writing-editor/use-writing-editor-state"
import { WritingEditorBody } from "@/views/writing-editor/writing-editor-body"
import { WritingEditorHeader } from "@/views/writing-editor/writing-editor-header"

export default function WritingEditorView({
  promptId,
  writingId,
}: {
  promptId?: number
  writingId?: string
}) {
  const {
    dateLabel,
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
  } = useWritingEditorState({
    promptId,
    writingId,
  })

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <WritingEditorHeader
        title={title}
        writingIdNumber={writingIdNumber}
        isSaving={isSaving}
        onBack={handleBack}
        onDelete={handleDelete}
        onSave={handleSave}
      />
      <WritingEditorBody
        dateLabel={dateLabel}
        editor={editor}
        handleTitleChange={handleTitleChange}
        isPromptLoading={isPromptLoading}
        onOpenPromptSheet={() => setShowPromptSheet(true)}
        onTogglePromptCollapsed={() => setPromptCollapsed((value) => !value)}
        prompt={prompt}
        promptCollapsed={promptCollapsed}
        title={title}
        titleRef={titleRef}
        wordCount={wordCount}
        writingIdNumber={writingIdNumber}
      />
      <LeaveConfirmDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        onLeaveWithoutSave={handleLeaveWithoutSave}
        onSaveAndLeave={handleSaveAndLeave}
        isSaving={isSaving}
      />
      <PromptBottomSheet
        open={showPromptSheet}
        onOpenChange={setShowPromptSheet}
        onSelectPrompt={handleSelectPrompt}
      />
    </div>
  )
}
