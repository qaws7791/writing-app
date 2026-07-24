import type {
  getAdminCourseEditor,
  uploadAdminContentAsset,
} from "@workspace/http-client/admin"

export type AdminCourseEditorFixture = Awaited<
  ReturnType<typeof getAdminCourseEditor>
>
export type AdminContentAssetFixture = Awaited<
  ReturnType<typeof uploadAdminContentAsset>
>

export function createAdminCourseEditorFixture(
  overrides: Readonly<Partial<AdminCourseEditorFixture>> = {}
): AdminCourseEditorFixture {
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

export function createAdminContentAssetFixture(
  overrides: Readonly<Partial<AdminContentAssetFixture>> = {}
): AdminContentAssetFixture {
  return {
    altText: "글쓰기 코스 표지",
    byteSize: 1_024,
    contentType: "image/webp",
    courseId: "course-1",
    curriculumVersionId: "course-1-v2",
    id: "asset-cover-1",
    kind: "course-cover",
    url: "https://assets.example.test/course-cover.webp",
    ...overrides,
  }
}
