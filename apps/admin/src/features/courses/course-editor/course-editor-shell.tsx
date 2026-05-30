import * as React from "react"
import { AlertCircle } from "lucide-react"

import type { AdminEditorStepType } from "@workspace/core/admin"

import { CourseSummaryPanel } from "@/features/courses/course-editor/course-summary-panel"
import { CurriculumMap } from "@/features/courses/course-editor/curriculum-map"
import { getEditorChangeKind } from "@/features/courses/course-editor/editor-change-kind"
import {
  getNodeStatusLabel,
  getStepDisplayTitle,
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
  onAddStep?: (lessonId: string, type: AdminEditorStepType) => void
  onArchiveStep?: (stepId: string) => void
  onOpenPreview?: (lessonId: string) => void
  onMoveLesson?: (lessonId: string, targetIndex: number) => void
  onMoveStep?: (lessonId: string, stepId: string, targetIndex: number) => void
  onSelectLesson?: (lessonId: string) => void
  onSelectStep?: (lessonId: string, stepId: string) => void
  onUpdateChapterField?: (
    chapterId: string,
    field: "title",
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
  const { course, curriculum } = workingCopy
  const selectedLessonId =
    urlState.lessonId ?? curriculum.chapters[0]?.lessons[0]?.lessonId ?? null
  const lessons = curriculum.chapters.flatMap((chapter) => chapter.lessons)
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

  // 브레드크럼용 챕터 찾기
  const selectedChapter =
    curriculum.chapters.find((chapter) =>
      chapter.lessons.some((lesson) => lesson.lessonId === selectedLessonId)
    ) ?? null

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

  const handleBackToLesson = React.useCallback(() => {
    if (!selectedLessonId) return
    onSelectLesson?.(selectedLessonId)
  }, [onSelectLesson, selectedLessonId])

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
          편집
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
              chapters={curriculum.chapters}
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
          {isReadOnly && (
            <div className="flex items-center gap-2 border-b bg-amber-50 px-6 py-2.5 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
              <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
              <span>읽기 전용 상태에서는 편집할 수 없습니다.</span>
            </div>
          )}
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
            <WorkspaceBreadcrumb
              chapterTitle={selectedChapter?.title ?? null}
              lessonTitle={selectedLesson?.title ?? null}
              lessonStatus={selectedLesson?.status ?? null}
              stepTitle={
                selectedStep ? getStepDisplayTitle(selectedStep) : null
              }
              view={urlState.view}
            />
            {urlState.view === "preview" && selectedLesson ? (
              <LessonPreview
                lessonTitle={selectedLesson.title}
                onBack={handleBackToLesson}
                steps={selectedLessonSteps}
              />
            ) : urlState.view === "step" && selectedStep ? (
              <StepWorkspace
                isReadOnly={isReadOnly}
                lessonSteps={selectedLessonSteps}
                onBack={handleBackToLesson}
                onUpdateStepContent={onUpdateStepContent}
                step={selectedStep}
              />
            ) : (
              <LessonWorkspace
                changeKind={changeKind}
                isReadOnly={isReadOnly}
                lesson={selectedLesson}
                onAddStep={
                  selectedLessonId
                    ? (type) => onAddStep?.(selectedLessonId, type)
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

type WorkspaceBreadcrumbProps = {
  chapterTitle: string | null
  lessonTitle: string | null
  lessonStatus: string | null
  stepTitle: string | null
  view: CourseEditorUrlState["view"]
}

function WorkspaceBreadcrumb({
  chapterTitle,
  lessonTitle,
  lessonStatus,
  stepTitle,
  view,
}: WorkspaceBreadcrumbProps) {
  const isStepView = view === "step" && stepTitle !== null
  const isPreviewView = view === "preview"

  return (
    <nav
      aria-label="편집 위치"
      className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
    >
      {chapterTitle && (
        <>
          <span>{chapterTitle}</span>
          <span aria-hidden="true">/</span>
        </>
      )}
      {lessonTitle && (
        <>
          <span
            className={
              isStepView || isPreviewView ? "" : "font-medium text-foreground"
            }
          >
            {lessonTitle}
          </span>
          {lessonStatus && (
            <span className="rounded-full border px-1.5 py-0.5 text-[10px]">
              {getNodeStatusLabel(
                lessonStatus as "active" | "archived" | "deprecated"
              )}
            </span>
          )}
        </>
      )}
      {isStepView && stepTitle && (
        <>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-foreground">{stepTitle}</span>
        </>
      )}
      {isPreviewView && (
        <>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-foreground">미리보기</span>
        </>
      )}
    </nav>
  )
}
