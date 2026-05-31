"use client"

import * as React from "react"

import {
  createCourseEditorSaveInput,
  createCourseEditorWorkingCopy,
  type CourseEditorWorkingCopy,
} from "@/features/courses/course-editor/editor-state"
import type { CourseEditorStatus } from "@/features/courses/course-editor/course-editor-status"
import type { AdminApi } from "@/lib/api/admin-api"

type UseCourseEditorSaveCommandParams = {
  adminApi: AdminApi
  replaceWorkingCopy: (workingCopy: CourseEditorWorkingCopy) => void
  setStatus: React.Dispatch<React.SetStateAction<CourseEditorStatus | null>>
  workingCopy: CourseEditorWorkingCopy
}

export function useCourseEditorSaveCommand({
  adminApi,
  replaceWorkingCopy,
  setStatus,
  workingCopy,
}: UseCourseEditorSaveCommandParams) {
  const [isSaving, setIsSaving] = React.useState(false)

  const save = React.useCallback(async () => {
    setIsSaving(true)
    setStatus(null)

    try {
      const result = await adminApi.saveCourseEditorDocument(
        createCourseEditorSaveInput(workingCopy)
      )

      if (result.status === "error") {
        setStatus({
          kind: "error",
          message:
            result.error.code === "conflict"
              ? "다른 관리자가 먼저 저장했습니다. 최신 내용을 다시 불러온 뒤 변경을 다시 적용하세요."
              : result.error.message,
        })
        return
      }

      replaceWorkingCopy(
        createCourseEditorWorkingCopy({
          course: result.value.course,
          revision: result.value.revision,
          curriculum: result.value.curriculum,
        })
      )
      setStatus({ kind: "success", message: "저장되었습니다." })
    } finally {
      setIsSaving(false)
    }
  }, [adminApi, replaceWorkingCopy, setStatus, workingCopy])

  return { isSaving, save }
}
