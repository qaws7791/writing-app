import * as React from "react"

import type {
  AdminCourseDetailDto,
  AdminEditorCurriculumVersionDetailDto,
} from "@workspace/core/admin"

import { CourseSummaryPanel } from "@/features/courses/course-editor/course-summary-panel"
import { CurriculumMap } from "@/features/courses/course-editor/curriculum-map"
import { getEditorChangeKind } from "@/features/courses/course-editor/editor-change-kind"
import type { CourseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"
import { LessonWorkspace } from "@/features/courses/course-editor/lesson-workspace"

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
  const lessons = version.chapters.flatMap((chapter) => chapter.lessons)
  const selectedLesson =
    lessons.find((lesson) => lesson.lessonId === selectedLessonId) ?? null
  const selectedLessonSteps = selectedLessonId
    ? version.steps.filter((step) => step.lessonId === selectedLessonId)
    : []
  const changeKind = getEditorChangeKind({
    addedStepCount: 0,
    archivedChapterCount: 0,
    archivedLessonCount: 0,
    courseChanged: false,
    reorderedLessonCount: 0,
  })

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-[minmax(360px,520px)_1fr] overflow-hidden">
      <aside className="min-h-0 overflow-y-auto border-r bg-background">
        <div className="flex flex-col gap-8 p-6">
          <CourseSummaryPanel course={course} version={version} />
          <CurriculumMap
            chapters={version.chapters}
            selectedLessonId={selectedLessonId}
          />
        </div>
      </aside>
      <section className="min-h-0 overflow-y-auto bg-muted/20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
          <p className="text-xs font-medium text-muted-foreground">
            {selectedVersionId} · {urlState.view}
          </p>
          <LessonWorkspace
            changeKind={changeKind}
            lesson={selectedLesson}
            selectedStepId={urlState.stepId}
            steps={selectedLessonSteps}
          />
        </div>
      </section>
    </div>
  )
}
