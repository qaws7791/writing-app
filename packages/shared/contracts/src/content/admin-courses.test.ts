import { describe, expect, it } from "vitest"

import {
  adminCourseEditorDocumentSchema,
  adminCourseEditorWriteDocumentSchema,
} from "#contracts/content/admin-courses"

describe("admin course editor wire invariants", () => {
  it("서로 다른 계층에 있어도 중복 ID를 거절한다", () => {
    const result = adminCourseEditorDocumentSchema.safeParse({
      ...anEditableCourse(),
      units: [
        {
          id: "duplicate-id",
          lessons: [
            {
              category: null,
              description: null,
              estimatedMinutes: 5,
              id: "duplicate-id",
              sortOrder: 1,
              status: "active",
              steps: [],
              summary: [],
              title: "레슨",
            },
          ],
          sortOrder: 1,
          status: "active",
          title: "유닛",
        },
      ],
    })

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "ID는 중복될 수 없습니다.",
    ])
  })

  it("1부터 연속되지 않는 sortOrder를 거절한다", () => {
    const result = adminCourseEditorDocumentSchema.safeParse({
      ...anEditableCourse(),
      units: [
        {
          id: "unit-1",
          lessons: [],
          sortOrder: 2,
          status: "active",
          title: "유닛",
        },
      ],
    })

    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "sortOrder는 1부터 연속되어야 합니다.",
    ])
  })

  it("쓰기 요청에서 서버 소유 asset metadata를 거절한다", () => {
    const result = adminCourseEditorWriteDocumentSchema.safeParse({
      ...aWriteDocument(),
      assets: [
        {
          altText: "클라이언트가 위조한 설명",
          byteSize: 1,
          contentType: "image/webp",
          courseId: "course-1",
          curriculumVersionId: "course-1-v1",
          id: "asset-1",
          kind: "course-cover",
          url: "https://attacker.example/cover.webp",
        },
      ],
      coverAssetId: "asset-1",
    })

    expect(result.error?.issues).toMatchObject([
      { code: "unrecognized_keys", keys: ["assets"] },
    ])
  })

  it("새 저장에서는 정의되지 않은 카테고리를 거절한다", () => {
    const result = adminCourseEditorWriteDocumentSchema.safeParse({
      ...aWriteDocument(),
      category: "과거 카테고리",
    })

    expect(result.error?.issues).toMatchObject([
      { message: "카테고리를 목록에서 선택해 주세요.", path: ["category"] },
    ])
  })

  it("기존 조회에서는 정의되지 않은 카테고리를 보존한다", () => {
    const result = adminCourseEditorDocumentSchema.safeParse({
      ...anEditableCourse(),
      category: "과거 카테고리",
    })

    expect(result.success).toBe(true)
  })
})

function anEditableCourse() {
  return {
    assets: [],
    category: "미분류",
    coverAssetId: null,
    curriculumVersionId: "course-1-v1",
    description: "설명",
    editVersion: 1,
    id: "course-1",
    revision: 1,
    status: "active",
    title: "코스",
    units: [],
  }
}

function aWriteDocument() {
  const { assets: _assets, ...document } = anEditableCourse()
  return document
}
