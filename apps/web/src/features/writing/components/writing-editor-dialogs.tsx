import { Delete02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"

import { useVersionHistory } from "@/features/writing/hooks/use-version-history"
import type { VersionDetail } from "@/features/writing/sync"

import { WritingExportModal } from "./writing-export-modal"
import { WritingVersionHistoryModal } from "./writing-version-history-modal"

type GetContent = () => {
  bodyHtml: string
  bodyText: string
  title: string
}

type WritingEditorDialogsProps = {
  cancelPendingNavigation: () => void
  confirmPendingNavigation: () => void
  deleteDialogOpen: boolean
  writingId: number
  exportModalOpen: boolean
  getContent: GetContent
  isLeaveConfirmOpen: boolean
  onDelete: () => void
  onDeleteDialogOpenChange: (open: boolean) => void
  onExportModalOpenChange: (open: boolean) => void
  onRestoreComplete: (detail: VersionDetail) => void
  onVersionHistoryModalOpenChange: (open: boolean) => void
  versionHistoryModalOpen: boolean
  currentVersion?: number
}

export function WritingEditorDialogs({
  cancelPendingNavigation,
  confirmPendingNavigation,
  deleteDialogOpen,
  writingId,
  exportModalOpen,
  getContent,
  isLeaveConfirmOpen,
  onDelete,
  onDeleteDialogOpenChange,
  onExportModalOpenChange,
  onRestoreComplete,
  onVersionHistoryModalOpenChange,
  versionHistoryModalOpen,
  currentVersion,
}: WritingEditorDialogsProps) {
  const versionHistory = useVersionHistory({
    writingId,
    open: versionHistoryModalOpen,
    onRestoreComplete: (detail) => {
      onVersionHistoryModalOpenChange(false)
      onRestoreComplete(detail)
    },
  })

  return (
    <>
      <WritingExportModal
        open={exportModalOpen}
        onOpenChange={onExportModalOpenChange}
        getContent={getContent}
      />

      <WritingVersionHistoryModal
        open={versionHistoryModalOpen}
        onOpenChange={onVersionHistoryModalOpenChange}
        getContent={getContent}
        versions={versionHistory.versions}
        selectedDetail={versionHistory.selectedDetail}
        loading={versionHistory.loading}
        detailLoading={versionHistory.detailLoading}
        error={versionHistory.error}
        restoring={versionHistory.restoring}
        onSelectVersion={versionHistory.selectVersion}
        onRestore={versionHistory.restoreVersion}
        onRetry={versionHistory.retry}
        currentVersion={currentVersion}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={onDeleteDialogOpenChange}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
              <HugeiconsIcon
                icon={Delete02Icon}
                color="currentColor"
                strokeWidth={2}
              />
            </AlertDialogMedia>
            <AlertDialogTitle>이 글을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 글은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void onDelete()}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isLeaveConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelPendingNavigation()
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>저장되지 않은 변경이 있습니다</AlertDialogTitle>
            <AlertDialogDescription>
              지금 나가면 서버에 반영되지 않은 내용이 사라질 수 있습니다. 그래도
              이동할까요?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              variant="ghost"
              onClick={cancelPendingNavigation}
            >
              계속 작성
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmPendingNavigation}
            >
              나가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
