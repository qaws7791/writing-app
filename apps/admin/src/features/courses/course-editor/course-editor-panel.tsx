"use client"

import * as React from "react"
import { Archive, CheckCircle2, XCircle } from "lucide-react"

import type { AdminEditorStepType } from "@workspace/core/admin"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@workspace/ui/components/ui/alert-dialog"

import { CourseEditorHeader } from "@/features/courses/course-editor/course-editor-header"
import { CourseSummaryPanel } from "@/features/courses/course-editor/course-summary-panel"
import { CurriculumMap } from "@/features/courses/course-editor/curriculum-map"
import { LessonPreview } from "@/features/courses/course-editor/lesson-preview"
import { LessonWorkspace } from "@/features/courses/course-editor/lesson-workspace"
import {
  useCourseEditorChangeKind,
  useCourseEditorCommands,
  useCourseEditorState,
} from "@/features/courses/course-editor/course-editor-session"
import { StepWorkspace } from "@/features/courses/course-editor/step-workspace"

type CurriculumMapPanelProps = {
  onSelectLesson?: (lessonId: string) => void
}

export function CourseEditorHeaderContainer() {
  const { isSaving, workingCopy } = useCourseEditorState()
  const commands = useCourseEditorCommands()

  return (
    <CourseEditorHeader
      dirtyCount={workingCopy.dirty.changedFields.length}
      isSaving={isSaving}
      onSave={commands.save}
    />
  )
}

export function CourseEditorStatusToast() {
  const { status } = useCourseEditorState()
  const commands = useCourseEditorCommands()

  React.useEffect(() => {
    if (!status) return
    const timer = setTimeout(commands.dismissStatus, 4000)
    return () => clearTimeout(timer)
  }, [commands.dismissStatus, status])

  if (!status) return null

  const isError = status.kind === "error"

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className={`fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${
        isError
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-green-200 bg-green-50 text-green-800 dark:border-green-800/30 dark:bg-green-950/30 dark:text-green-400"
      }`}
    >
      {isError ? (
        <XCircle aria-hidden="true" className="size-4 shrink-0" />
      ) : (
        <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
      )}
      {status.message}
    </div>
  )
}

export function CourseEditorArchiveDialog() {
  const { archiveRequest } = useCourseEditorState()
  const commands = useCourseEditorCommands()

  const targetLabel = archiveRequest
    ? getArchiveTargetLabel(archiveRequest.kind)
    : "항목"

  return (
    <AlertDialog
      open={archiveRequest !== null}
      onOpenChange={(open) => {
        if (!open) {
          commands.cancelArchive()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Archive aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>{targetLabel} 보관</AlertDialogTitle>
          <AlertDialogDescription>
            {archiveRequest
              ? `"${archiveRequest.title}" ${targetLabel}을 보관하시겠습니까?`
              : "선택한 항목을 보관하시겠습니까?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={commands.cancelArchive}>
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            onClick={commands.confirmArchive}
          >
            보관
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function CourseSummaryPanelContainer() {
  const { isReadOnly, workingCopy } = useCourseEditorState()
  const commands = useCourseEditorCommands()

  return (
    <CourseSummaryPanel
      course={workingCopy.course}
      isReadOnly={isReadOnly}
      onUpdateCourseField={commands.updateCourseField}
    />
  )
}

function getArchiveTargetLabel(kind: "chapter" | "lesson" | "step") {
  if (kind === "chapter") return "챕터"
  if (kind === "lesson") return "레슨"
  return "스텝"
}

export function CurriculumMapPanel({
  onSelectLesson,
}: CurriculumMapPanelProps) {
  const { isReadOnly, selectedLessonId, workingCopy } = useCourseEditorState()
  const commands = useCourseEditorCommands()

  return (
    <CurriculumMap
      chapters={workingCopy.curriculum.chapters}
      isReadOnly={isReadOnly}
      onAddChapter={commands.addChapter}
      onAddLesson={commands.addLesson}
      onArchiveChapter={commands.archiveChapter}
      onArchiveLesson={commands.archiveLesson}
      onMoveLesson={commands.moveLesson}
      onSelectLesson={onSelectLesson ?? commands.selectLesson}
      onUpdateChapterField={commands.updateChapterField}
      selectedLessonId={selectedLessonId}
    />
  )
}

export function LessonWorkspacePanel() {
  const {
    isReadOnly,
    selectedLesson,
    selectedLessonId,
    selectedLessonSteps,
    urlState,
  } = useCourseEditorState()
  const changeKind = useCourseEditorChangeKind()
  const commands = useCourseEditorCommands()

  return (
    <LessonWorkspace
      changeKind={changeKind}
      isReadOnly={isReadOnly}
      lesson={selectedLesson}
      onAddStep={
        selectedLessonId
          ? (type: AdminEditorStepType) =>
              commands.addStep(selectedLessonId, type)
          : undefined
      }
      onArchiveStep={commands.archiveStep}
      onMoveStep={
        selectedLessonId
          ? (stepId, targetIndex) =>
              commands.moveStep(selectedLessonId, stepId, targetIndex)
          : undefined
      }
      onOpenPreview={
        selectedLessonId
          ? () => commands.openPreview(selectedLessonId)
          : undefined
      }
      onSelectStep={
        selectedLessonId
          ? (stepId) => commands.selectStep(selectedLessonId, stepId)
          : undefined
      }
      onUpdateLessonField={commands.updateLessonField}
      selectedStepId={urlState.stepId}
      steps={selectedLessonSteps}
    />
  )
}

export function LessonPreviewPanel() {
  const { selectedLesson, selectedLessonId, selectedLessonSteps } =
    useCourseEditorState()
  const commands = useCourseEditorCommands()

  if (!selectedLesson) return null

  return (
    <LessonPreview
      lessonTitle={selectedLesson.title}
      onBack={
        selectedLessonId
          ? () => commands.selectLesson(selectedLessonId)
          : undefined
      }
      steps={selectedLessonSteps}
    />
  )
}

export function StepWorkspacePanel() {
  const { isReadOnly, selectedLessonId, selectedLessonSteps, selectedStep } =
    useCourseEditorState()
  const commands = useCourseEditorCommands()

  if (!selectedStep) return null

  return (
    <StepWorkspace
      isReadOnly={isReadOnly}
      lessonSteps={selectedLessonSteps}
      onBack={
        selectedLessonId
          ? () => commands.selectLesson(selectedLessonId)
          : undefined
      }
      onUpdateStepContent={commands.updateStepContent}
      step={selectedStep}
    />
  )
}
