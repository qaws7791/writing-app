"use client"

import * as React from "react"

import type {
  AdminCourseDetailDto,
  AdminEditorCurriculumDetailDto,
} from "@workspace/core/admin"

import { AdminHeader } from "@/components/admin-header"
import {
  CourseEditorArchiveDialog,
  CourseEditorHeaderContainer,
  CourseEditorStatusToast,
} from "@/features/courses/course-editor/course-editor-panel"
import { CourseEditorProvider } from "@/features/courses/course-editor/course-editor-session"
import { CourseEditorShell } from "@/features/courses/course-editor/course-editor-shell"
import type { CourseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"
import type { AdminApi } from "@/lib/api/admin-api"
import { createHttpAdminApi } from "@/lib/api/http-admin-api"

type AdminCourseDetailPageProps = {
  adminApi?: AdminApi
  adminApiBaseUrl?: string
  course: AdminCourseDetailDto
  revision: number
  curriculum: AdminEditorCurriculumDetailDto
  urlState: CourseEditorUrlState
}

export function AdminCourseDetailPage({
  adminApi,
  adminApiBaseUrl,
  course,
  revision,
  curriculum,
  urlState,
}: AdminCourseDetailPageProps) {
  const api = React.useMemo(() => {
    if (adminApi) {
      return adminApi
    }

    if (!adminApiBaseUrl) {
      throw new Error("adminApiBaseUrl is required when adminApi is omitted.")
    }

    return createHttpAdminApi({ baseUrl: adminApiBaseUrl })
  }, [adminApi, adminApiBaseUrl])

  return (
    <CourseEditorProvider
      adminApi={api}
      course={course}
      curriculum={curriculum}
      revision={revision}
      urlState={urlState}
    >
      <AdminHeader
        actions={<CourseEditorHeaderContainer />}
        description="현재 공개 커리큘럼을 직접 편집합니다."
        title="코스 편집"
      />
      <CourseEditorArchiveDialog />
      <CourseEditorStatusToast />
      <main className="min-h-0 flex-1">
        <CourseEditorShell />
      </main>
    </CourseEditorProvider>
  )
}
