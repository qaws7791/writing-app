import * as React from "react"

import type {
  AdminCourseDetailDto,
  AdminEditorCurriculumVersionDetailDto,
} from "@workspace/core/admin"

import { CourseSummaryPanel } from "@/features/courses/course-editor/course-summary-panel"
import type { CourseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"

type CourseEditorShellProps = {
  course: AdminCourseDetailDto
  selectedVersionId: string
  urlState: CourseEditorUrlState
  version: AdminEditorCurriculumVersionDetailDto
}

export function CourseEditorShell({
  course,
  selectedVersionId,
  urlState,
  version,
}: CourseEditorShellProps) {
  const selectedLessonId =
    urlState.lessonId ?? version.chapters[0]?.lessons[0]?.lessonId ?? null

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-[minmax(360px,520px)_1fr] overflow-hidden">
      <aside className="min-h-0 overflow-y-auto border-r bg-background">
        <div className="flex flex-col gap-8 p-6">
          <CourseSummaryPanel course={course} version={version} />
          <section className="space-y-3" aria-labelledby="curriculum-map">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="curriculum-map"
                className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
              >
                Curriculum
              </h2>
              <span className="text-xs text-muted-foreground">
                {version.status}
              </span>
            </div>
            <div className="space-y-4">
              {version.chapters.map((chapter) => (
                <div key={chapter.id} className="space-y-2">
                  <h3 className="text-sm font-medium">{chapter.title}</h3>
                  <div className="space-y-1 border-l pl-3">
                    {chapter.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        data-selected={
                          lesson.lessonId === selectedLessonId
                            ? true
                            : undefined
                        }
                      >
                        <span>{lesson.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {lesson.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>
      <section className="min-h-0 overflow-y-auto bg-muted/20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {selectedVersionId}
            </p>
            <h2 className="text-3xl font-semibold">
              {selectedLessonId ?? "레슨을 선택하세요"}
            </h2>
            <p className="text-sm text-muted-foreground">
              선택한 내부 화면: {urlState.view}
            </p>
          </div>
          <div className="rounded-md border bg-background p-6">
            <p className="text-sm text-muted-foreground">
              다음 단계에서 레슨 작업대와 스텝 편집 폼이 이 영역에 연결됩니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
