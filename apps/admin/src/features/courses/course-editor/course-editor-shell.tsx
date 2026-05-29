import * as React from "react"

import { CourseSummaryPanel } from "@/features/courses/course-editor/course-summary-panel"
import { CurriculumMap } from "@/features/courses/course-editor/curriculum-map"
import { getEditorChangeKind } from "@/features/courses/course-editor/editor-change-kind"
import {
  getEditorViewLabel,
  getNodeStatusLabel,
} from "@/features/courses/course-editor/editor-labels"
import type { CourseEditorWorkingCopy } from "@/features/courses/course-editor/editor-state"
import type { CourseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"
import { LessonPreview } from "@/features/courses/course-editor/lesson-preview"
import { LessonWorkspace } from "@/features/courses/course-editor/lesson-workspace"
import { StepWorkspace } from "@/features/courses/course-editor/step-workspace"

type CourseEditorShellProps = {
  isReadOnly?: boolean
  onAddChapter?: () => void
  onAddLesson?: (chapterId: string) => void
  onArchiveChapter?: (chapterId: string) => void
  onArchiveLesson?: (lessonId: string) => void
  onAddStep?: (lessonId: string) => void
  onArchiveStep?: (stepId: string) => void
  onOpenPreview?: (lessonId: string) => void
  onOpenSettings?: (lessonId: string) => void
  onMoveLesson?: (lessonId: string, targetIndex: number) => void
  onMoveStep?: (lessonId: string, stepId: string, targetIndex: number) => void
  onSelectLesson?: (lessonId: string) => void
  onSelectStep?: (lessonId: string, stepId: string) => void
  onUpdateChapterField?: (
    chapterId: string,
    field: "label" | "title",
    value: string
  ) => void
  onUpdateCourseField?: (field: "description" | "title", value: string) => void
  onUpdateLessonField?: (
    lessonId: string,
    field: "description" | "title",
    value: string
  ) => void
  onUpdateStepContent?: (stepId: string, key: string, value: unknown) => void
  urlState: CourseEditorUrlState
  workingCopy: CourseEditorWorkingCopy
}

export function CourseEditorShell({
  isReadOnly = false,
  onAddChapter,
  onAddLesson,
  onArchiveChapter,
  onArchiveLesson,
  onAddStep,
  onArchiveStep,
  onOpenPreview,
  onOpenSettings,
  onMoveLesson,
  onMoveStep,
  onSelectLesson,
  onSelectStep,
  onUpdateChapterField,
  onUpdateCourseField,
  onUpdateLessonField,
  onUpdateStepContent,
  urlState,
  workingCopy,
}: CourseEditorShellProps) {
  const [mobilePane, setMobilePane] = React.useState<
    "curriculum" | "workspace"
  >("workspace")
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

  const handleSelectLesson = React.useCallback(
    (lessonId: string) => {
      setMobilePane("workspace")
      onSelectLesson?.(lessonId)
    },
    [onSelectLesson]
  )

  const handleSelectStep = React.useCallback(
    (stepId: string) => {
      if (!selectedLessonId) {
        return
      }

      setMobilePane("workspace")
      onSelectStep?.(selectedLessonId, stepId)
    },
    [onSelectStep, selectedLessonId]
  )

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      <div className="grid grid-cols-2 gap-1 border-b bg-background p-2 lg:hidden">
        <button
          type="button"
          aria-pressed={mobilePane === "curriculum"}
          className="rounded-md px-3 py-2 text-sm font-medium aria-pressed:bg-muted"
          onClick={() => setMobilePane("curriculum")}
        >
          커리큘럼
        </button>
        <button
          type="button"
          aria-pressed={mobilePane === "workspace"}
          className="rounded-md px-3 py-2 text-sm font-medium aria-pressed:bg-muted"
          onClick={() => setMobilePane("workspace")}
        >
          작업대
        </button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(360px,520px)_1fr]">
        <aside
          className={`min-h-0 overflow-y-auto border-b bg-background lg:block lg:border-r lg:border-b-0 ${
            mobilePane === "curriculum" ? "block" : "hidden"
          }`}
        >
          <div className="flex flex-col gap-8 p-6">
            <CourseSummaryPanel
              course={course}
              isReadOnly={isReadOnly}
              onUpdateCourseField={onUpdateCourseField}
            />
            <CurriculumMap
              chapters={version.chapters}
              isReadOnly={isReadOnly}
              onAddChapter={onAddChapter}
              onAddLesson={onAddLesson}
              onArchiveChapter={onArchiveChapter}
              onArchiveLesson={onArchiveLesson}
              onMoveLesson={onMoveLesson}
              onSelectLesson={handleSelectLesson}
              onUpdateChapterField={onUpdateChapterField}
              selectedLessonId={selectedLessonId}
            />
          </div>
        </aside>
        <section
          className={`min-h-0 overflow-y-auto bg-muted/20 lg:block ${
            mobilePane === "workspace" ? "block" : "hidden"
          }`}
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
            <p className="text-xs font-medium text-muted-foreground">
              v{version.versionNumber} · {getEditorViewLabel(urlState.view)}
            </p>
            {urlState.view === "preview" && selectedLesson ? (
              <LessonPreview
                lessonTitle={selectedLesson.title}
                steps={selectedLessonSteps}
              />
            ) : urlState.view === "step" && selectedStep ? (
              <StepWorkspace
                isReadOnly={isReadOnly}
                lessonSteps={selectedLessonSteps}
                onUpdateStepContent={onUpdateStepContent}
                step={selectedStep}
              />
            ) : urlState.view === "settings" && selectedLesson ? (
              <LessonSettingsWorkspace
                isReadOnly={isReadOnly}
                lesson={selectedLesson}
                onUpdateLessonField={onUpdateLessonField}
              />
            ) : (
              <LessonWorkspace
                changeKind={changeKind}
                isReadOnly={isReadOnly}
                lesson={selectedLesson}
                onAddStep={
                  selectedLessonId
                    ? () => onAddStep?.(selectedLessonId)
                    : undefined
                }
                onArchiveStep={onArchiveStep}
                onMoveStep={
                  selectedLessonId
                    ? (stepId, targetIndex) =>
                        onMoveStep?.(selectedLessonId, stepId, targetIndex)
                    : undefined
                }
                onOpenPreview={
                  selectedLessonId
                    ? () => onOpenPreview?.(selectedLessonId)
                    : undefined
                }
                onOpenSettings={
                  selectedLessonId
                    ? () => onOpenSettings?.(selectedLessonId)
                    : undefined
                }
                onSelectStep={handleSelectStep}
                onUpdateLessonField={onUpdateLessonField}
                selectedStepId={urlState.stepId}
                steps={selectedLessonSteps}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

type LessonSettingsWorkspaceProps = {
  isReadOnly: boolean
  lesson: CourseEditorWorkingCopy["version"]["chapters"][number]["lessons"][number]
  onUpdateLessonField?: (
    lessonId: string,
    field: "description" | "title",
    value: string
  ) => void
}

function LessonSettingsWorkspace({
  isReadOnly,
  lesson,
  onUpdateLessonField,
}: LessonSettingsWorkspaceProps) {
  return (
    <section className="space-y-6" aria-labelledby="lesson-settings">
      <header className="space-y-2 border-b pb-4">
        <p className="text-xs font-medium text-muted-foreground">
          {getEditorViewLabel("settings")} · {getNodeStatusLabel(lesson.status)}
        </p>
        <h1 id="lesson-settings" className="text-2xl font-semibold">
          레슨 설정
        </h1>
      </header>
      <div className="grid max-w-2xl gap-4">
        <label className="grid gap-2 text-sm">
          레슨 제목
          <input
            className="rounded-md border bg-background px-3 py-2 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isReadOnly}
            value={lesson.title}
            onChange={(event) =>
              onUpdateLessonField?.(
                lesson.lessonId,
                "title",
                event.currentTarget.value
              )
            }
          />
        </label>
        <label className="grid gap-2 text-sm">
          레슨 설명
          <textarea
            className="min-h-24 rounded-md border bg-background px-3 py-2 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isReadOnly}
            value={lesson.description}
            onChange={(event) =>
              onUpdateLessonField?.(
                lesson.lessonId,
                "description",
                event.currentTarget.value
              )
            }
          />
        </label>
        <div className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">레슨 상태</span>
          <span className="font-medium">
            {getNodeStatusLabel(lesson.status)}
          </span>
        </div>
      </div>
    </section>
  )
}
