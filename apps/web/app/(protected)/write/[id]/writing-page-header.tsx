import Link from "next/link"
import {
  ArrowLeft01Icon,
  Clock01Icon,
  Delete02Icon,
  Download01Icon,
  Share08Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { formatDraftMeta } from "@/lib/phase-one-format"
import type { DraftDetail } from "@/lib/phase-one-types"
import type { DraftSyncState } from "@/lib/phase-one-draft-sync"
import { Button } from "@workspace/ui/components/button"
import { buttonVariants } from "@workspace/ui/components/button.styles"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

type WritingPageHeaderProps = {
  editorTitle: string
  loading: boolean
  onDeleteClick: () => void
  onExportClick: () => void
  onShare: () => void
  onVersionHistoryClick: () => void
  persistedDraft: DraftDetail | null
  syncState: DraftSyncState
}

export function WritingPageHeader({
  editorTitle,
  loading,
  onDeleteClick,
  onExportClick,
  onShare,
  onVersionHistoryClick,
  persistedDraft,
  syncState,
}: WritingPageHeaderProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
      <div className="pointer-events-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link
          aria-label="뒤로 가기"
          href="/write"
          className={buttonVariants({
            size: "icon",
            variant: "outline",
          })}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} color="currentColor" />
        </Link>

        <div className="min-w-0 flex-1 px-4">
          <p className="truncate text-sm font-medium text-foreground/80 md:text-base">
            {editorTitle || "새 글"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {syncState === "saving" && "임시 저장 중"}
            {syncState === "saved" &&
              (persistedDraft
                ? `임시 저장됨 · ${formatDraftMeta(persistedDraft.lastSavedAt)}`
                : "임시 저장됨")}
            {syncState === "error" && "저장 지연 중"}
            {syncState === "idle" &&
              (loading ? "초안 준비 중" : "입력을 시작하면 저장됩니다")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="icon" aria-label="설정">
                  <HugeiconsIcon
                    icon={Settings02Icon}
                    size={22}
                    color="currentColor"
                    strokeWidth={1.8}
                  />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>글쓰기</DropdownMenuLabel>
                <DropdownMenuItem onClick={onExportClick}>
                  <HugeiconsIcon
                    icon={Download01Icon}
                    color="currentColor"
                    strokeWidth={2}
                  />
                  파일로 내보내기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void onShare()}>
                  <HugeiconsIcon
                    icon={Share08Icon}
                    color="currentColor"
                    strokeWidth={2}
                  />
                  공유
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onVersionHistoryClick}>
                  <HugeiconsIcon
                    icon={Clock01Icon}
                    color="currentColor"
                    strokeWidth={2}
                  />
                  버전 기록
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={onDeleteClick} variant="destructive">
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    color="currentColor"
                    strokeWidth={2}
                  />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
