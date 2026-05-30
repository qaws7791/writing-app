"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle } from "lucide-react"

import type {
  AdminCourseDetailDto,
  AdminCurriculumVersionSummaryDto,
  AdminEditorCurriculumVersionDetailDto,
  AdminEditorStepType,
} from "@workspace/core/admin"

import { AdminHeader } from "@/components/admin-header"
import { CourseEditorHeader } from "@/features/courses/course-editor/course-editor-header"
import { CourseEditorShell } from "@/features/courses/course-editor/course-editor-shell"
import { getVersionStatusLabel } from "@/features/courses/course-editor/editor-labels"
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
  selectedVersionId: string
  urlState: CourseEditorUrlState
  version: AdminEditorCurriculumVersionDetailDto
  versions: AdminCurriculumVersionSummaryDto[]
}

export function AdminCourseDetailPage({
  adminApi,
  adminApiBaseUrl = "http://localhost:4001",
  course,
  selectedVersionId,
  urlState,
  version,
  versions,
}: AdminCourseDetailPageProps) {
  const router = useRouter()
  const api = React.useMemo(
    () => adminApi ?? createHttpAdminApi({ baseUrl: adminApiBaseUrl }),
    [adminApi, adminApiBaseUrl]
  )
  const [workingCopy, setWorkingCopy] = React.useState(() =>
    createCourseEditorWorkingCopy({ course, version })
  )
  const [isSaving, setIsSaving] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
  const [isVersionMenuOpen, setIsVersionMenuOpen] = React.useState(false)
  const [localUrlState, setLocalUrlState] = React.useState(urlState)

  React.useEffect(() => {
    setWorkingCopy(createCourseEditorWorkingCopy({ course, version }))
  }, [course, version])

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
          version: result.value,
        })
      )
      setStatusMessage("저장되었습니다.")
    } finally {
      setIsSaving(false)
    }
  }, [api, workingCopy])
  const handleOpenVersionMenu = React.useCallback(() => {
    setIsVersionMenuOpen((current) => !current)
  }, [])

  const navigateToVersion = React.useCallback(
    (versionId: string) => {
      if (
        workingCopy.dirty.hasChanges &&
        !window.confirm("저장하지 않은 변경사항을 버리고 이동하시겠습니까?")
      ) {
        return
      }

      router.replace(`/courses/${course.id}?version=${versionId}`)
      router.refresh()
    },
    [course.id, router, workingCopy.dirty.hasChanges]
  )

  const handleCreateDraft = React.useCallback(async () => {
    if (
      workingCopy.dirty.hasChanges &&
      !window.confirm("저장하지 않은 변경사항을 버리고 새 초안을 만들까요?")
    ) {
      return
    }

    const result = await api.createCurriculumDraft(course.id)

    if (result.status === "error") {
      setStatusMessage(result.error.message)
      return
    }

    navigateToVersion(result.value.id)
  }, [api, course.id, navigateToVersion, workingCopy.dirty.hasChanges])

  React.useEffect(() => {
    const hasDraft = versions.some(
      (curriculumVersion) => curriculumVersion.status === "draft"
    )

    if (workingCopy.version.status === "draft" || hasDraft) {
      return
    }

    setStatusMessage("편집 가능한 초안을 준비하는 중입니다.")
    void handleCreateDraft()
  }, [handleCreateDraft, versions, workingCopy.version.status])

  const handlePublishDraft = React.useCallback(async () => {
    if (!window.confirm("현재 초안을 발행하시겠습니까?")) {
      return
    }

    const result = await api.publishCurriculumVersion(
      course.id,
      selectedVersionId
    )

    if (result.status === "error") {
      setStatusMessage(result.error.message)
      return
    }

    setStatusMessage("발행되었습니다.")
    router.refresh()
  }, [api, course.id, router, selectedVersionId])

  const handleDiscardDraft = React.useCallback(async () => {
    if (!window.confirm("현재 초안을 폐기하시겠습니까?")) {
      return
    }

    const result = await api.discardCurriculumVersion(
      course.id,
      selectedVersionId
    )

    if (result.status === "error") {
      setStatusMessage(result.error.message)
      return
    }

    setStatusMessage("초안을 폐기했습니다.")
    router.replace(`/courses/${course.id}`)
    router.refresh()
  }, [api, course.id, router, selectedVersionId])

  const handleRestoreDraft = React.useCallback(
    async (sourceVersionId: string) => {
      if (!window.confirm("선택한 버전에서 초안을 복원하시겠습니까?")) {
        return
      }

      const result = await api.restoreCurriculumDraft(course.id, {
        replaceDraft: true,
        sourceVersionId,
      })

      if (result.status === "error") {
        setStatusMessage(result.error.message)
        return
      }

      navigateToVersion(result.value.id)
    },
    [api, course.id, navigateToVersion]
  )

  const replaceEditorUrl = React.useCallback(
    (query: Record<string, string>) => {
      const searchParams = new URLSearchParams()

      searchParams.set("version", selectedVersionId)
      if (query["view"]) {
        searchParams.set("view", query["view"])
      }
      if (query["lessonId"]) {
        searchParams.set("lessonId", query["lessonId"])
      }
      if (query["stepId"]) {
        searchParams.set("stepId", query["stepId"])
      }

      const nextPath = `/courses/${course.id}?${searchParams.toString()}`
      const nextView = query["view"] ?? "lesson"

      setLocalUrlState({
        lessonId: query["lessonId"] ?? null,
        stepId: nextView === "step" ? (query["stepId"] ?? null) : null,
        versionId: selectedVersionId,
        view:
          nextView === "step" || nextView === "preview" ? nextView : "lesson",
      })
      window.history.replaceState(window.history.state, "", nextPath)
    },
    [course.id, selectedVersionId]
  )

  const updateWorkingCopy = React.useCallback(
    (
      updater: (current: CourseEditorWorkingCopy) => CourseEditorWorkingCopy
    ) => {
      setStatusMessage(null)
      setWorkingCopy((current) => {
        if (current.version.status !== "draft") {
          return current
        }

        return updater(current)
      })
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
          id: createDraftId("draft-version-lesson"),
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
            canSave={workingCopy.version.status === "draft"}
            dirtyCount={workingCopy.dirty.changedFields.length}
            isSaving={isSaving}
            onOpenVersionMenu={handleOpenVersionMenu}
            onSave={handleSave}
            versionNumber={workingCopy.version.versionNumber}
            versionStatus={workingCopy.version.status}
          />
        }
        description="초안 기준으로 커리큘럼을 편집합니다."
        title="코스 편집"
      />
      <StatusToast
        message={statusMessage}
        onDismiss={() => setStatusMessage(null)}
      />
      {isVersionMenuOpen ? (
        <section
          aria-label="버전 메뉴"
          className="grid gap-2 border-b bg-background px-6 py-3 text-sm"
        >
          <p className="font-medium">커리큘럼 버전</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-2"
              onClick={handleCreateDraft}
            >
              새 초안 생성
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-2"
              disabled={workingCopy.version.status !== "draft"}
              onClick={handlePublishDraft}
            >
              현재 초안 발행
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-2"
              disabled={workingCopy.version.status !== "draft"}
              onClick={handleDiscardDraft}
            >
              현재 초안 폐기
            </button>
            {versions.map((curriculumVersion) => (
              <React.Fragment key={curriculumVersion.id}>
                <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                  v{curriculumVersion.versionNumber} ·{" "}
                  {getVersionStatusLabel(curriculumVersion.status)}
                </span>
                {curriculumVersion.status === "published" ? (
                  <button
                    type="button"
                    className="rounded-md border px-3 py-2"
                    onClick={() => handleRestoreDraft(curriculumVersion.id)}
                  >
                    v{curriculumVersion.versionNumber}에서 복원
                  </button>
                ) : null}
              </React.Fragment>
            ))}
            {versions.length === 0 ? (
              <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                버전 없음
              </span>
            ) : null}
          </div>
        </section>
      ) : null}
      <main className="min-h-0 flex-1">
        <CourseEditorShell
          isReadOnly={workingCopy.version.status !== "draft"}
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
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${
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
