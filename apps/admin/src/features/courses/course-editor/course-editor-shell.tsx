import * as React from "react"
import { AlertCircle } from "lucide-react"

import {
  CourseSummaryPanelContainer,
  CurriculumMapPanel,
  LessonPreviewPanel,
  LessonWorkspacePanel,
  StepWorkspacePanel,
} from "@/features/courses/course-editor/course-editor-panel"
import {
  useCourseEditorCommands,
  useCourseEditorState,
} from "@/features/courses/course-editor/course-editor-session"
import {
  getNodeStatusLabel,
  getStepDisplayTitle,
} from "@/features/courses/course-editor/editor-labels"
import type { CourseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"

export function CourseEditorShell() {
  const [mobilePane, setMobilePane] = React.useState<
    "curriculum" | "workspace"
  >("workspace")
  const {
    isReadOnly,
    selectedChapter,
    selectedLesson,
    selectedStep,
    urlState,
  } = useCourseEditorState()
  const commands = useCourseEditorCommands()

  const handleSelectLesson = React.useCallback(
    (lessonId: string) => {
      setMobilePane("workspace")
      commands.selectLesson(lessonId)
    },
    [commands]
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
            <CourseSummaryPanelContainer />
            <CurriculumMapPanel onSelectLesson={handleSelectLesson} />
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
              <LessonPreviewPanel />
            ) : urlState.view === "step" && selectedStep ? (
              <StepWorkspacePanel />
            ) : (
              <LessonWorkspacePanel />
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
