"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import type {
  AdminCourseDetailDto,
  AdminCurriculumVersionSummaryDto,
  AdminEditorCurriculumVersionDetailDto,
} from "@workspace/core/admin"

import { AdminHeader } from "@/components/admin-header"
import { CourseEditorHeader } from "@/features/courses/course-editor/course-editor-header"
import { CourseEditorShell } from "@/features/courses/course-editor/course-editor-shell"
import {
  createCourseEditorSaveInput,
  createCourseEditorWorkingCopy,
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

  const handleSave = React.useCallback(async () => {
    setIsSaving(true)
    setStatusMessage(null)

    try {
      const result = await api.saveCurriculumVersionContent(
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
      router.replace(`/courses/${course.id}?version=${versionId}`)
      router.refresh()
    },
    [course.id, router]
  )

  const handleCreateDraft = React.useCallback(async () => {
    const result = await api.createCurriculumDraft(course.id)

    if (result.status === "error") {
      setStatusMessage(result.error.message)
      return
    }

    navigateToVersion(result.value.id)
  }, [api, course.id, navigateToVersion])

  const handlePublishDraft = React.useCallback(async () => {
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
    const result = await api.discardCurriculumVersion(
      course.id,
      selectedVersionId
    )

    if (result.status === "error") {
      setStatusMessage(result.error.message)
      return
    }

    setStatusMessage("draft를 폐기했습니다.")
    router.replace(`/courses/${course.id}`)
    router.refresh()
  }, [api, course.id, router, selectedVersionId])

  const handleRestoreDraft = React.useCallback(
    async (sourceVersionId: string) => {
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
          nextView === "step" ||
          nextView === "preview" ||
          nextView === "settings"
            ? nextView
            : "lesson",
      })
      window.history.replaceState(window.history.state, "", nextPath)
    },
    [course.id, selectedVersionId]
  )

  function updateWorkingCopy(
    updater: (current: CourseEditorWorkingCopy) => CourseEditorWorkingCopy
  ) {
    setStatusMessage(null)
    setWorkingCopy((current) => updater(current))
  }

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
          />
        }
        description={`${workingCopy.course.title} 커리큘럼을 draft 기준으로 편집합니다.`}
        title="Course Studio"
      />
      {statusMessage ? (
        <p className="border-b px-6 py-2 text-sm text-muted-foreground">
          {statusMessage}
        </p>
      ) : null}
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
              새 draft 생성
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-2"
              disabled={workingCopy.version.status !== "draft"}
              onClick={handlePublishDraft}
            >
              현재 draft 발행
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-2"
              disabled={workingCopy.version.status !== "draft"}
              onClick={handleDiscardDraft}
            >
              현재 draft 폐기
            </button>
            {versions.map((curriculumVersion) => (
              <React.Fragment key={curriculumVersion.id}>
                <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                  v{curriculumVersion.versionNumber} ·{" "}
                  {curriculumVersion.status}
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
          onUpdateCourseField={(field, value) =>
            updateWorkingCopy((current) =>
              updateCourseField(current, field, value)
            )
          }
          onUpdateLessonField={(lessonId, field, value) =>
            updateWorkingCopy((current) =>
              updateLessonField(current, lessonId, field, value)
            )
          }
          onOpenPreview={(lessonId) =>
            replaceEditorUrl({
              lessonId,
              view: "preview",
            })
          }
          onOpenSettings={() =>
            replaceEditorUrl({
              view: "settings",
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
          selectedVersionId={selectedVersionId}
          urlState={localUrlState}
          workingCopy={workingCopy}
        />
      </main>
    </>
  )
}
