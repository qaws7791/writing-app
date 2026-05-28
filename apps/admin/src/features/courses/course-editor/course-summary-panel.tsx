import * as React from "react"

import type {
  AdminCourseDetailDto,
  AdminEditorCurriculumVersionDetailDto,
} from "@workspace/core/admin"

type CourseSummaryPanelProps = {
  course: AdminCourseDetailDto
  onUpdateCourseField?: (
    field: "description" | "thumbnailPath" | "title",
    value: string
  ) => void
  version: AdminEditorCurriculumVersionDetailDto
}

export function CourseSummaryPanel({
  course,
  onUpdateCourseField,
  version,
}: CourseSummaryPanelProps) {
  const lessonCount = version.chapters.reduce(
    (total, chapter) => total + chapter.lessons.length,
    0
  )

  return (
    <section className="flex flex-col gap-4" aria-labelledby="course-summary">
      <div
        aria-label={`${course.title} 썸네일`}
        className="aspect-[16/9] w-full rounded-md border bg-muted bg-cover bg-center"
        role="img"
        style={{ backgroundImage: `url(${course.thumbnailPath})` }}
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="grid min-w-0 flex-1 gap-1 text-sm">
            <span className="text-xs text-muted-foreground">코스 제목</span>
            <input
              id="course-summary"
              className="min-w-0 rounded-md border bg-background px-3 py-2 text-xl font-semibold"
              value={course.title}
              onChange={(event) =>
                onUpdateCourseField?.("title", event.currentTarget.value)
              }
            />
          </label>
          <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
            v{version.versionNumber}
          </span>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">코스 설명</span>
          <textarea
            className="min-h-24 rounded-md border bg-background px-3 py-2 leading-6"
            value={course.description}
            onChange={(event) =>
              onUpdateCourseField?.("description", event.currentTarget.value)
            }
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">썸네일 경로</span>
          <input
            className="rounded-md border bg-background px-3 py-2"
            value={course.thumbnailPath}
            onChange={(event) =>
              onUpdateCourseField?.("thumbnailPath", event.currentTarget.value)
            }
          />
        </label>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-md border p-3">
          <dt className="text-xs text-muted-foreground">챕터</dt>
          <dd className="mt-1 font-medium">{version.chapters.length}</dd>
        </div>
        <div className="rounded-md border p-3">
          <dt className="text-xs text-muted-foreground">레슨</dt>
          <dd className="mt-1 font-medium">{lessonCount}</dd>
        </div>
        <div className="rounded-md border p-3">
          <dt className="text-xs text-muted-foreground">스텝</dt>
          <dd className="mt-1 font-medium">{version.steps.length}</dd>
        </div>
      </dl>
    </section>
  )
}
