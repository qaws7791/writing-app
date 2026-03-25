"use client"

import { useState } from "react"
import {
  Clock01Icon,
  ArrowTurnBackwardIcon,
  Loading03Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Button } from "@workspace/ui/components/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Skeleton } from "@workspace/ui/components/skeleton"

import DOMPurify from "dompurify"

import { draftContentToHtml } from "@/domain/draft/model/draft.service"
import type {
  VersionDetail,
  VersionSummary,
} from "@/features/writing/sync/types"

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html)
}

const REASON_LABELS: Record<VersionSummary["reason"], string> = {
  auto: "자동 저장",
  manual: "수동 저장",
  restore: "복원됨",
}

function formatVersionDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type WritingVersionHistoryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  getContent: () => { title: string; bodyHtml: string }
  versions: VersionSummary[]
  selectedDetail: VersionDetail | null
  loading: boolean
  detailLoading: boolean
  error: string | null
  restoring: boolean
  onSelectVersion: (version: number) => void
  onRestore: (version: number) => void
  onRetry: () => void
  currentVersion?: number
}

export function WritingVersionHistoryModal({
  open,
  onOpenChange,
  getContent,
  versions,
  selectedDetail,
  loading,
  detailLoading,
  error,
  restoring,
  onSelectVersion,
  onRestore,
  onRetry,
  currentVersion,
}: WritingVersionHistoryModalProps) {
  const [restoreConfirmVersion, setRestoreConfirmVersion] = useState<
    number | null
  >(null)

  const { title, bodyHtml } = getContent()

  const isCurrentVersion =
    selectedDetail !== null && selectedDetail.version === currentVersion

  const previewContent =
    selectedDetail !== null
      ? isCurrentVersion
        ? sanitizeHtml(
            `<h1>${title || "제목 없음"}</h1>${bodyHtml || "<p>내용이 없습니다.</p>"}`
          )
        : sanitizeHtml(
            `<h1>${selectedDetail.title || "제목 없음"}</h1>${draftContentToHtml(selectedDetail.content) || "<p>내용이 없습니다.</p>"}`
          )
      : ""

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex h-[85vh] max-h-150 flex-col gap-0 p-0 sm:max-w-4xl"
          showCloseButton
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
              버전 기록
            </DialogTitle>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            {/* 미리보기 영역 */}
            <div className="flex flex-1 flex-col border-b md:border-e md:border-b-0">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-medium text-muted-foreground">
                  미리보기
                </span>
                {selectedDetail && !isCurrentVersion && !restoring && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRestoreConfirmVersion(selectedDetail.version)
                    }
                  >
                    <HugeiconsIcon
                      icon={ArrowTurnBackwardIcon}
                      size={14}
                      strokeWidth={2}
                    />
                    이 버전으로 복원
                  </Button>
                )}
                {restoring && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      size={14}
                      className="animate-spin"
                    />
                    복원 중...
                  </span>
                )}
              </div>
              <ScrollArea className="flex-1 px-6 pb-6">
                {detailLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                ) : previewContent ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    버전을 선택하면 미리보기가 표시됩니다.
                  </p>
                )}
              </ScrollArea>
            </div>

            {/* 버전 목록 영역 */}
            <div className="flex w-full flex-col md:w-72 md:min-w-0">
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                버전 목록
              </div>
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <HugeiconsIcon
                      icon={AlertCircleIcon}
                      size={24}
                      className="text-muted-foreground"
                    />
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" onClick={onRetry}>
                      다시 시도
                    </Button>
                  </div>
                ) : versions.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    아직 저장된 버전이 없습니다.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-0 p-2">
                    {versions.map((version) => (
                      <li key={version.id}>
                        <button
                          type="button"
                          className="w-full rounded-md px-4 py-3 text-left text-sm transition-colors hover:bg-accent data-selected:bg-accent data-selected:font-medium"
                          data-selected={
                            selectedDetail?.version === version.version
                              ? ""
                              : undefined
                          }
                          onClick={() => onSelectVersion(version.version)}
                        >
                          <div className="font-medium">
                            {REASON_LABELS[version.reason]}
                            {version.version === currentVersion && (
                              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                (현재)
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            v{version.version} ·{" "}
                            {formatVersionDate(version.createdAt)}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={restoreConfirmVersion !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRestoreConfirmVersion(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>이 버전으로 복원할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              현재 작성 중인 내용이 선택한 버전의 내용으로 교체됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (restoreConfirmVersion !== null) {
                  onRestore(restoreConfirmVersion)
                  setRestoreConfirmVersion(null)
                }
              }}
            >
              복원
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
