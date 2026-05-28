import * as React from "react"

import type {
  AdminCourseDetailDto,
  AdminEditorCurriculumVersionDetailDto,
} from "@workspace/core/admin"

type CourseSummaryPanelProps = {
  course: AdminCourseDetailDto
  version: AdminEditorCurriculumVersionDetailDto
}

export function CourseSummaryPanel({
  course,
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
          <h2 id="course-summary" className="text-2xl font-semibold">
            {course.title}
          </h2>
          <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
            v{version.versionNumber}
          </span>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {course.description}
        </p>
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
