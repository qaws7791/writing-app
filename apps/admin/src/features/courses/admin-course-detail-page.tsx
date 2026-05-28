"use client"

import * as React from "react"

import type {
  AdminCourseDetailDto,
  AdminEditorCurriculumVersionDetailDto,
} from "@workspace/core/admin"

import { AdminHeader } from "@/components/admin-header"
import { CourseEditorHeader } from "@/features/courses/course-editor/course-editor-header"
import { CourseEditorShell } from "@/features/courses/course-editor/course-editor-shell"
import type { CourseEditorUrlState } from "@/features/courses/course-editor/editor-url-state"

type AdminCourseDetailPageProps = {
  course: AdminCourseDetailDto
  selectedVersionId: string
  urlState: CourseEditorUrlState
  version: AdminEditorCurriculumVersionDetailDto
}

export function AdminCourseDetailPage({
  course,
  selectedVersionId,
  urlState,
  version,
}: AdminCourseDetailPageProps) {
  const handleSave = React.useCallback(() => {}, [])
  const handleOpenVersionMenu = React.useCallback(() => {}, [])

  return (
    <>
      <AdminHeader
        actions={
          <CourseEditorHeader
            dirtyCount={0}
            isSaving={false}
            onOpenVersionMenu={handleOpenVersionMenu}
            onSave={handleSave}
          />
        }
        description={`${course.title} 커리큘럼을 draft 기준으로 편집합니다.`}
        title="Course Studio"
      />
      <main className="min-h-0 flex-1">
        <CourseEditorShell
          course={course}
          selectedVersionId={selectedVersionId}
          urlState={urlState}
          version={version}
        />
      </main>
    </>
  )
}
