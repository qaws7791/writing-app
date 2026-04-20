"use client"

import { ArrowLeft, Check, MoreVertical, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu"

export function WritingEditorHeader({
  isSaving,
  onBack,
  onDelete,
  onSave,
  title,
  writingIdNumber,
}: {
  isSaving: boolean
  onBack: () => void
  onDelete: () => void
  onSave: () => void
  title: string
  writingIdNumber?: number
}) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-background px-4 py-3">
      <Button
        size="icon"
        variant="ghost"
        aria-label="뒤로 가기"
        onClick={onBack}
      >
        <ArrowLeft size={24} strokeWidth={1.5} />
      </Button>

      <span className="flex-1 truncate px-2 text-center text-sm leading-5 font-medium text-foreground">
        {title || "새 글"}
      </span>

      <div className="flex items-center gap-2">
        {writingIdNumber && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="icon" variant="ghost" aria-label="더보기" />
              }
            >
              <MoreVertical size={24} strokeWidth={1.5} />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 size={20} strokeWidth={1.5} />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          size="icon"
          variant="default"
          aria-label="저장"
          onClick={onSave}
          disabled={isSaving}
        >
          <Check size={24} strokeWidth={2} />
        </Button>
      </div>
    </header>
  )
}
