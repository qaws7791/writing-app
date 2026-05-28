import * as React from "react"

import { CourseSummaryPanel } from "@/features/courses/course-editor/course-summary-panel"
import { CurriculumMap } from "@/features/courses/course-editor/curriculum-map"
import { getEditorChangeKind } from "@/features/courses/course-editor/editor-change-kind"
import type { CourseEditorWorkingCopy } from "@/features/courses/course-editor/editor-state"
import type { CourseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"
import { LessonPreview } from "@/features/courses/course-editor/lesson-preview"
import { LessonWorkspace } from "@/features/courses/course-editor/lesson-workspace"
import { StepWorkspace } from "@/features/courses/course-editor/step-workspace"

type CourseEditorShellProps = {
  onOpenPreview?: (lessonId: string) => void
  onOpenSettings?: () => void
  onSelectLesson?: (lessonId: string) => void
  onSelectStep?: (lessonId: string, stepId: string) => void
  onUpdateCourseField?: (
    field: "description" | "thumbnailPath" | "title",
    value: string
  ) => void
  onUpdateLessonField?: (
    lessonId: string,
    field: "description" | "title",
    value: string
  ) => void
  onUpdateStepContent?: (stepId: string, key: string, value: string) => void
  selectedVersionId: string
  urlState: CourseEditorUrlState
  workingCopy: CourseEditorWorkingCopy
}

export function CourseEditorShell({
  onOpenPreview,
  onOpenSettings,
  onSelectLesson,
  onSelectStep,
  onUpdateCourseField,
  onUpdateLessonField,
  onUpdateStepContent,
  selectedVersionId,
  urlState,
  workingCopy,
}: CourseEditorShellProps) {
  const { course, version } = workingCopy
  const selectedLessonId =
    urlState.lessonId ?? version.chapters[0]?.lessons[0]?.lessonId ?? null
  const lessons = version.chapters.flatMap((chapter) => chapter.lessons)
  const selectedLesson =
    lessons.find((lesson) => lesson.lessonId === selectedLessonId) ?? null
  const selectedLessonSteps = selectedLessonId
    ? workingCopy.steps.filter((step) => step.lessonId === selectedLessonId)
    : []
  const selectedStep =
    selectedLessonSteps.find((step) => step.id === urlState.stepId) ?? null
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
          <CourseSummaryPanel
            course={course}
            onUpdateCourseField={onUpdateCourseField}
            version={version}
          />
          <CurriculumMap
            chapters={version.chapters}
            onSelectLesson={onSelectLesson}
            selectedLessonId={selectedLessonId}
          />
        </div>
      </aside>
      <section className="min-h-0 overflow-y-auto bg-muted/20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
          <p className="text-xs font-medium text-muted-foreground">
            {selectedVersionId} · {urlState.view}
          </p>
          {urlState.view === "preview" && selectedLesson ? (
            <LessonPreview
              lessonTitle={selectedLesson.title}
              steps={selectedLessonSteps}
            />
          ) : urlState.view === "step" && selectedStep ? (
            <StepWorkspace
              lessonSteps={selectedLessonSteps}
              onUpdateStepContent={onUpdateStepContent}
              step={selectedStep}
            />
          ) : (
            <LessonWorkspace
              changeKind={changeKind}
              lesson={selectedLesson}
              onOpenPreview={
                selectedLessonId
                  ? () => onOpenPreview?.(selectedLessonId)
                  : undefined
              }
              onOpenSettings={onOpenSettings}
              onSelectStep={
                selectedLessonId
                  ? (stepId) => onSelectStep?.(selectedLessonId, stepId)
                  : undefined
              }
              onUpdateLessonField={onUpdateLessonField}
              selectedStepId={urlState.stepId}
              steps={selectedLessonSteps}
            />
          )}
        </div>
      </section>
    </div>
  )
}
