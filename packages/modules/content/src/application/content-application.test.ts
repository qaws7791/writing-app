import { describe, expect, it, vi } from "vitest"
import { err, ok } from "@workspace/kernel/result"
import type {
  AdminId,
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
  LessonId,
  LessonStepId,
  UnitId,
} from "@workspace/types/ids"

import { createContentApplication } from "#content/application/content-application"
import type {
  ContentAssetStoragePort,
  ContentApplicationDependencies,
  ContentRepository,
} from "#content/application/ports/content-ports"
import type { ContentAsset } from "#content/domain/content-asset"
import type { CurriculumDraft } from "#content/domain/content-model"

const adminId = "admin-1" as AdminId
const now = new Date("2026-07-22T00:00:00.000Z")

describe("content application", () => {
  it("course 생성 command에 서버 ID와 시각을 전달한다", async () => {
    const fixture = createApplicationFixture()

    await expect(
      fixture.application.createCourse(adminId)
    ).resolves.toMatchObject({
      value: { courseId: "course-1" },
    })

    expect(fixture.repository.createCourse).toHaveBeenCalledWith({
      courseId: "course-1",
      now,
    })
  })

  it("stale edit version을 optimistic conflict로 반환한다", async () => {
    const fixture = createApplicationFixture()

    await expect(
      fixture.application.saveCourseEditor({
        adminId,
        document: toEditorDocument(draft),
        expectedEditVersion: 1,
      })
    ).resolves.toEqual(err({ kind: "content-conflict" }))
    expect(fixture.repository.saveDraft).not.toHaveBeenCalled()
  })

  it("검증된 publish 결정을 repository transaction에 전달한다", async () => {
    const order: string[] = []
    const fixture = createApplicationFixture({ order })

    const result = await fixture.application.publishCourse({
      adminId,
      courseId: draft.courseId,
      expectedEditVersion: draft.editVersion,
    })

    expect(result.isOk()).toBe(true)
    expect(order).toEqual(["commit"])
  })

  it("object key를 저장소 URL로 해석해 editor와 learner 참조에 반환한다", async () => {
    const asset = createAsset()
    const assetStorage: ContentAssetStoragePort = {
      async deleteObjects() {
        throw new Error("asset deletion was not expected")
      },
      async putObject() {
        throw new Error("asset upload was not expected")
      },
      resolveUrl: vi.fn(
        (objectKey) => `https://assets.example.test/${objectKey}`
      ),
    }
    const fixture = createApplicationFixture({
      assetStorage,
      assets: [asset],
    })

    await expect(
      fixture.application.getCourseEditor(draft.courseId)
    ).resolves.toMatchObject({
      assets: [
        {
          altText: asset.altText,
          id: asset.id,
          kind: asset.kind,
          url: `https://assets.example.test/${asset.objectKey}`,
        },
      ],
    })
    await expect(
      fixture.application.resolveAssetReferences([
        asset.id,
        "missing-asset" as ContentAssetId,
        asset.id,
      ])
    ).resolves.toEqual([
      {
        altText: asset.altText,
        id: asset.id,
        kind: asset.kind,
        url: `https://assets.example.test/${asset.objectKey}`,
      },
    ])
    expect(assetStorage.resolveUrl).toHaveBeenCalledTimes(2)
  })
})

function createApplicationFixture({
  assetStorage = null,
  assets = [],
  order = [],
}: {
  readonly assetStorage?: ContentAssetStoragePort | null
  readonly assets?: readonly ContentAsset[]
  readonly order?: string[]
} = {}) {
  const repository = {
    createAsset: vi.fn(),
    createCourse: vi.fn(async () => ok(toEditorDocument(draft))),
    findCourse: vi.fn(async () => ({
      createdAt: now,
      id: draft.courseId,
      publishedCurriculumVersionId: null,
      sortOrder: 1,
      status: "active" as const,
    })),
    findCurriculumByLesson: vi.fn(async () => null),
    findDraft: vi.fn(async () => ok(draft)),
    deleteOrphanedAssetCandidates: vi.fn(async () => ok(0)),
    listPublishedCourseSummaries: vi.fn(async () => []),
    listActiveAssetsForCourse: vi.fn(async () => assets),
    listOrphanedAssetCandidates: vi.fn(async () => ok([])),
    publishDraft: vi.fn(async ({ publishedRevision }) => {
      order.push("commit")
      return ok(publishedRevision)
    }),
    readAssetOwner: vi.fn(async () => null),
    readActiveAssetsByIds: vi.fn(async (assetIds) =>
      assets.filter((asset) => assetIds.includes(asset.id))
    ),
    readCourseEditor: vi.fn(async () => toEditorDocument(draft)),
    readCourses: vi.fn(async (input) => ({
      items: [],
      page: input.page,
      pageSize: input.pageSize,
      totalItems: 0,
      totalPages: 1,
    })),
    readCurriculum: vi.fn(async () => null),
    saveCourse: vi.fn(async ({ course }) => ok(course)),
    saveDraft: vi.fn(async ({ draft: value }) =>
      ok({ ...value, editVersion: value.editVersion + 1 })
    ),
  } satisfies ContentRepository
  const dependencies = {
    assetIdGenerator: {
      next: vi.fn(() => "content-asset-1" as ContentAssetId),
    },
    assetImageProcessor: {
      process: vi.fn(async (input) =>
        ok({ bytes: input.bytes, contentType: input.contentType })
      ),
    },
    assetStorage,
    clock: { now: vi.fn(() => now) },
    courseIdGenerator: { next: vi.fn(() => draft.courseId) },
    repository,
  } satisfies ContentApplicationDependencies

  return {
    application: createContentApplication(dependencies),
    dependencies,
    repository,
  }
}

function toEditorDocument({
  visualKey: _visualKey,
  ...document
}: CurriculumDraft) {
  return { ...document, assets: [] }
}

const draft: CurriculumDraft = {
  category: "입문",
  courseId: "course-1" as CourseId,
  coverAssetId: null,
  curriculumVersionId: "curriculum:course-1:1" as CurriculumVersionId,
  description: "설명",
  editVersion: 0,
  revision: 1,
  title: "코스",
  units: [
    {
      id: "unit-1" as UnitId,
      lessons: [
        {
          category: null,
          description: null,
          estimatedMinutes: 5,
          id: "lesson-1" as LessonId,
          sortOrder: 1,
          status: "active",
          steps: [
            {
              contentJson: JSON.stringify({ prompt: "작성하세요" }),
              id: "step-1" as LessonStepId,
              sortOrder: 1,
              status: "active",
              type: "WRITE",
            },
          ],
          summary: [],
          title: "레슨",
        },
      ],
      sortOrder: 1,
      status: "active",
      title: "유닛",
    },
  ],
  visualKey: "basic-sentence-writing",
}

function createAsset(): ContentAsset {
  return {
    altText: "코스 표지",
    byteSize: 4,
    contentType: "image/jpeg",
    courseId: draft.courseId,
    createdAt: now,
    curriculumVersionId: draft.curriculumVersionId,
    id: "content-asset-1" as ContentAssetId,
    kind: "course-cover",
    objectKey: "content-assets/course-cover/content-asset-1.jpg",
    orphanedAt: null,
    status: "active",
    updatedAt: now,
  }
}
