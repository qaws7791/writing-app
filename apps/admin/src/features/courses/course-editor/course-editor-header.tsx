import * as React from "react"
import { History, Save } from "lucide-react"

import type { AdminEditorCurriculumVersionDetailDto } from "@workspace/core/admin"
import { Button } from "@workspace/ui/components/ui/button"

type CourseEditorHeaderProps = {
  version: AdminEditorCurriculumVersionDetailDto
}

export function CourseEditorHeader({ version }: CourseEditorHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground md:inline">
        revision {version.revision}
      </span>
      <Button type="button" variant="outline">
        <History aria-hidden="true" />
        버전 메뉴
      </Button>
      <Button type="button">
        <Save aria-hidden="true" />
        저장
      </Button>
    </div>
  )
}
