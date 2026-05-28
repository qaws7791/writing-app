"use client"

import * as React from "react"
import { History, Save } from "lucide-react"

import { Button } from "@workspace/ui/components/ui/button"

type CourseEditorHeaderProps = {
  dirtyCount: number
  isSaving: boolean
  onOpenVersionMenu: () => void
  onSave: () => void
}

export function CourseEditorHeader({
  dirtyCount,
  isSaving,
  onOpenVersionMenu,
  onSave,
}: CourseEditorHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground md:inline">
        {dirtyCount > 0 ? `${dirtyCount}개 변경` : "변경 없음"}
      </span>
      <Button type="button" variant="outline" onClick={onOpenVersionMenu}>
        <History aria-hidden="true" />
        버전 메뉴
      </Button>
      <Button
        type="button"
        disabled={dirtyCount === 0 || isSaving}
        onClick={onSave}
      >
        <Save aria-hidden="true" />
        {isSaving ? "저장 중" : "저장"}
      </Button>
    </div>
  )
}
