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

import { WritingExportModal } from "./writing-export-modal"
import { WritingVersionHistoryModal } from "./writing-version-history-modal"

type GetContent = () => {
  bodyHtml: string
  bodyText: string
  title: string
}

type WritingPageDialogsProps = {
  cancelPendingNavigation: () => void
  confirmPendingNavigation: () => void
  deleteDialogOpen: boolean
  exportModalOpen: boolean
  getContent: GetContent
  isLeaveConfirmOpen: boolean
  onDelete: () => void
  onDeleteDialogOpenChange: (open: boolean) => void
  onExportModalOpenChange: (open: boolean) => void
  onVersionHistoryModalOpenChange: (open: boolean) => void
  versionHistoryModalOpen: boolean
}

export function WritingPageDialogs({
  cancelPendingNavigation,
  confirmPendingNavigation,
  deleteDialogOpen,
  exportModalOpen,
  getContent,
  isLeaveConfirmOpen,
  onDelete,
  onDeleteDialogOpenChange,
  onExportModalOpenChange,
  onVersionHistoryModalOpenChange,
  versionHistoryModalOpen,
}: WritingPageDialogsProps) {
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
