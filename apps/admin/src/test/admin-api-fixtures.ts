import type { uploadAdminContentAsset } from "@workspace/http-client/admin"

export type AdminContentAssetFixture = Awaited<
  ReturnType<typeof uploadAdminContentAsset>
>

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
