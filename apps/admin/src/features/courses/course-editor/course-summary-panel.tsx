import * as React from "react"

import type { AdminCourseDetailDto } from "@workspace/core/admin"

type CourseSummaryPanelProps = {
  course: AdminCourseDetailDto
  isReadOnly?: boolean
  onUpdateCourseField?: (field: "description" | "title", value: string) => void
}

export function CourseSummaryPanel({
  course,
  isReadOnly = false,
  onUpdateCourseField,
}: CourseSummaryPanelProps) {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="course-summary">
      <div className="space-y-2">
        <label className="grid min-w-0 gap-1 text-sm">
          <span className="text-xs text-muted-foreground">코스 제목</span>
          <input
            id="course-summary"
            className="min-w-0 rounded-md border bg-background px-3 py-2 text-xl font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isReadOnly}
            value={course.title}
            onChange={(event) =>
              onUpdateCourseField?.("title", event.currentTarget.value)
            }
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">코스 설명</span>
          <textarea
            className="min-h-24 rounded-md border bg-background px-3 py-2 leading-6 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isReadOnly}
            value={course.description}
            onChange={(event) =>
              onUpdateCourseField?.("description", event.currentTarget.value)
            }
          />
        </label>
      </div>
    </section>
  )
}
