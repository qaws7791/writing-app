import type { AdminCourseDetail } from "@/features/course-editor/model/admin-course-editor"

export function createAdminCourseEditorFixture(
  overrides: Readonly<Partial<AdminCourseDetail>> = {}
): AdminCourseDetail {
  return {
    assets: [],
    category: "미분류",
    coverAssetId: null,
    curriculumVersionId: "course-1-v2",
    description: "강의 설명",
    editVersion: 1,
    id: "course-1",
    revision: 2,
    status: "active",
    title: "글쓰기 코스",
    units: [],
    ...overrides,
  }
}
