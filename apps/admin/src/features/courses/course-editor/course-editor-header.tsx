"use client"

import * as React from "react"
import { History, Save } from "lucide-react"

import { Button } from "@workspace/ui/components/ui/button"

import { getVersionStatusLabel } from "@/features/courses/course-editor/editor-labels"

type CourseEditorHeaderProps = {
  canSave: boolean
  dirtyCount: number
  isSaving: boolean
  onOpenVersionMenu: () => void
  onSave: () => void
  versionNumber: number
  versionStatus: "archived" | "draft" | "published"
}

export function CourseEditorHeader({
  canSave,
  dirtyCount,
  isSaving,
  onOpenVersionMenu,
  onSave,
  versionNumber,
  versionStatus,
}: CourseEditorHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
        v{versionNumber} · {getVersionStatusLabel(versionStatus)}
      </span>
      <span className="hidden text-xs text-muted-foreground md:inline">
        {dirtyCount > 0 ? `${dirtyCount}개 변경` : "변경 없음"}
      </span>
      <Button type="button" variant="outline" onClick={onOpenVersionMenu}>
        <History aria-hidden="true" />
        버전 메뉴
      </Button>
      <Button
        type="button"
        disabled={!canSave || dirtyCount === 0 || isSaving}
        onClick={onSave}
      >
        <Save aria-hidden="true" />
        {isSaving ? "저장 중" : "저장"}
      </Button>
    </div>
  )
}
