"use client"

import * as React from "react"
import { CheckCircle2, XCircle } from "lucide-react"

import type {
  AdminCourseDetailDto,
  AdminEditorCurriculumDetailDto,
  AdminEditorStepType,
} from "@workspace/core/admin"

import { AdminHeader } from "@/components/admin-header"
import { CourseEditorHeader } from "@/features/courses/course-editor/course-editor-header"
import { CourseEditorShell } from "@/features/courses/course-editor/course-editor-shell"
import {
  addChapter,
  addLesson,
  addStep,
  archiveChapter,
  archiveLesson,
  archiveStep,
  createCourseEditorSaveInput,
  createCourseEditorWorkingCopy,
  moveLesson,
  moveStep,
  updateChapterField,
  updateCourseField,
  updateLessonField,
  updateStepContentField,
  type CourseEditorWorkingCopy,
} from "@/features/courses/course-editor/editor-state"
import type { CourseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"
import type { AdminApi } from "@/lib/api/admin-api"
import { createHttpAdminApi } from "@/lib/api/http-admin-api"

type AdminCourseDetailPageProps = {
  adminApi?: AdminApi
  adminApiBaseUrl?: string
  course: AdminCourseDetailDto
  curriculum: AdminEditorCurriculumDetailDto
  urlState: CourseEditorUrlState
}

export function AdminCourseDetailPage({
  adminApi,
  adminApiBaseUrl = "http://localhost:4001",
  course,
  curriculum,
  urlState,
}: AdminCourseDetailPageProps) {
  const api = React.useMemo(
    () => adminApi ?? createHttpAdminApi({ baseUrl: adminApiBaseUrl }),
    [adminApi, adminApiBaseUrl]
  )
  const [workingCopy, setWorkingCopy] = React.useState(() =>
    createCourseEditorWorkingCopy({ course, curriculum })
  )
  const [isSaving, setIsSaving] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
  const [localUrlState, setLocalUrlState] = React.useState(urlState)

  React.useEffect(() => {
    setWorkingCopy(createCourseEditorWorkingCopy({ course, curriculum }))
  }, [course, curriculum])

  React.useEffect(() => {
    setLocalUrlState(urlState)
  }, [urlState])

  React.useEffect(() => {
    if (!workingCopy.dirty.hasChanges) {
      return
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [workingCopy.dirty.hasChanges])

  const handleSave = React.useCallback(async () => {
    setIsSaving(true)
    setStatusMessage(null)

    try {
      const result = await api.saveCourseEditorDocument(
        createCourseEditorSaveInput(workingCopy)
      )

      if (result.status === "error") {
        setStatusMessage(result.error.message)
        return
      }

      setWorkingCopy(
        createCourseEditorWorkingCopy({
          course: workingCopy.course,
          curriculum: result.value,
        })
      )
      setStatusMessage("저장되었습니다.")
    } finally {
      setIsSaving(false)
    }
  }, [api, workingCopy])

  const replaceEditorUrl = React.useCallback(
    (query: Record<string, string>) => {
      const searchParams = new URLSearchParams()

      if (query["view"]) {
        searchParams.set("view", query["view"])
      }
      if (query["lessonId"]) {
        searchParams.set("lessonId", query["lessonId"])
      }
      if (query["stepId"]) {
        searchParams.set("stepId", query["stepId"])
      }

      const queryString = searchParams.toString()
      const nextPath =
        queryString.length > 0
          ? `/courses/${course.id}?${queryString}`
          : `/courses/${course.id}`
      const nextView = query["view"] ?? "lesson"

      setLocalUrlState({
        lessonId: query["lessonId"] ?? null,
        stepId: nextView === "step" ? (query["stepId"] ?? null) : null,
        view:
          nextView === "step" || nextView === "preview" ? nextView : "lesson",
      })
      window.history.replaceState(window.history.state, "", nextPath)
    },
    [course.id]
  )

  const updateWorkingCopy = React.useCallback(
    (
      updater: (current: CourseEditorWorkingCopy) => CourseEditorWorkingCopy
    ) => {
      setStatusMessage(null)
      setWorkingCopy((current) => updater(current))
    },
    []
  )

  const handleAddChapter = React.useCallback(() => {
    updateWorkingCopy((current) =>
      addChapter(current, {
        id: createDraftId("draft-chapter"),
        title: "새 챕터",
      })
    )
  }, [updateWorkingCopy])

  const handleAddLesson = React.useCallback(
    (chapterId: string) => {
      updateWorkingCopy((current) =>
        addLesson(current, chapterId, {
          id: createDraftId("draft-course-lesson"),
          lessonId: createDraftId("draft-lesson"),
          title: "새 레슨",
          description: "새 레슨 설명을 입력하세요.",
        })
      )
    },
    [updateWorkingCopy]
  )

  const handleAddStep = React.useCallback(
    (lessonId: string, type: AdminEditorStepType) => {
      updateWorkingCopy((current) =>
        addStep(current, {
          id: createDraftId("draft-step"),
          lessonId,
          type,
          title: "새 스텝",
        })
      )
    },
    [updateWorkingCopy]
  )

  const handleArchiveChapter = React.useCallback(
    (chapterId: string) => {
      if (!window.confirm("이 챕터를 보관하시겠습니까?")) {
        return
      }

      updateWorkingCopy((current) => archiveChapter(current, chapterId))
    },
    [updateWorkingCopy]
  )

  const handleArchiveLesson = React.useCallback(
    (lessonId: string) => {
      if (!window.confirm("이 레슨을 보관하시겠습니까?")) {
        return
      }

      updateWorkingCopy((current) => archiveLesson(current, lessonId))
    },
    [updateWorkingCopy]
  )

  const handleArchiveStep = React.useCallback(
    (stepId: string) => {
      if (!window.confirm("이 스텝을 보관하시겠습니까?")) {
        return
      }

      updateWorkingCopy((current) => archiveStep(current, stepId))
    },
    [updateWorkingCopy]
  )

  return (
    <>
      <AdminHeader
        actions={
          <CourseEditorHeader
            dirtyCount={workingCopy.dirty.changedFields.length}
            isSaving={isSaving}
            onSave={handleSave}
          />
        }
        description="현재 공개 커리큘럼을 직접 편집합니다."
        title="코스 편집"
      />
      <StatusToast
        message={statusMessage}
        onDismiss={() => setStatusMessage(null)}
      />
      <main className="min-h-0 flex-1">
        <CourseEditorShell
          isReadOnly={false}
          onAddChapter={handleAddChapter}
          onAddLesson={handleAddLesson}
          onAddStep={handleAddStep}
          onArchiveChapter={handleArchiveChapter}
          onArchiveLesson={handleArchiveLesson}
          onArchiveStep={handleArchiveStep}
          onUpdateCourseField={(field, value) =>
            updateWorkingCopy((current) =>
              updateCourseField(current, field, value)
            )
          }
          onUpdateChapterField={(chapterId, field, value) =>
            updateWorkingCopy((current) =>
              updateChapterField(current, chapterId, field, value)
            )
          }
          onUpdateLessonField={(lessonId, field, value) =>
            updateWorkingCopy((current) =>
              updateLessonField(current, lessonId, field, value)
            )
          }
          onMoveLesson={(lessonId, targetIndex) =>
            updateWorkingCopy((current) =>
              moveLesson(current, lessonId, targetIndex)
            )
          }
          onMoveStep={(lessonId, stepId, targetIndex) =>
            updateWorkingCopy((current) =>
              moveStep(current, lessonId, stepId, targetIndex)
            )
          }
          onOpenPreview={(lessonId) =>
            replaceEditorUrl({
              lessonId,
              view: "preview",
            })
          }
          onSelectLesson={(lessonId) =>
            replaceEditorUrl({
              lessonId,
              view: "lesson",
            })
          }
          onSelectStep={(lessonId, stepId) =>
            replaceEditorUrl({
              lessonId,
              stepId,
              view: "step",
            })
          }
          onUpdateStepContent={(stepId, key, value) =>
            updateWorkingCopy((current) =>
              updateStepContentField(current, stepId, key, value)
            )
          }
          urlState={localUrlState}
          workingCopy={workingCopy}
        />
      </main>
    </>
  )
}

type StatusToastProps = {
  message: string | null
  onDismiss: () => void
}

function StatusToast({ message, onDismiss }: StatusToastProps) {
  React.useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null

  const isError =
    message.includes("실패") ||
    message.includes("오류") ||
    message.includes("못했") ||
    message.includes("없습니다")

  return (
    <div
      role="status"
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
      {message}
    </div>
  )
}

function createDraftId(prefix: string) {
  const randomId =
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12)

  return `${prefix}-${randomId}`
}
