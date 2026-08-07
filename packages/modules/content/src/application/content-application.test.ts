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
import { aContentRepository } from "#content/test/fixtures/a-content-repository"

const adminId = "admin-1" as AdminId
const now = new Date("2026-07-22T00:00:00.000Z")

describe("content application", () => {
  it("stale edit version을 optimistic conflict로 반환한다", async () => {
    const fixture = createApplicationFixture()

    await expect(
      fixture.application.saveCourseEditor({
        adminId,
        document: toEditorDocument(draft),
        expectedEditVersion: 1,
      })
    ).resolves.toEqual(err({ kind: "content-conflict" }))
    expect(fixture.saveDraft).not.toHaveBeenCalled()
  })

  it("검증된 publish 결정을 repository transaction에 전달한다", async () => {
    const fixture = createApplicationFixture()

    const result = await fixture.application.publishCourse({
      adminId,
      courseId: draft.courseId,
      expectedEditVersion: draft.editVersion,
    })

    expect(result.isOk()).toBe(true)
    expect(fixture.publishDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedEditVersion: draft.editVersion,
        publishedRevision: expect.objectContaining({
          courseId: draft.courseId,
          revision: draft.revision,
        }),
      })
    )
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
      resolveUrl: (objectKey) => `https://assets.example.test/${objectKey}`,
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
  })
})

function createApplicationFixture({
  assetStorage = null,
  assets = [],
}: {
  readonly assetStorage?: ContentAssetStoragePort | null
  readonly assets?: readonly ContentAsset[]
} = {}) {
  const createCourse = vi.fn(async () => ok(toEditorDocument(draft)))
  const publishDraft = vi.fn(
    async ({
      publishedRevision,
    }: Parameters<ContentRepository["publishDraft"]>[0]) =>
      ok(publishedRevision)
  )
  const saveDraft = vi.fn(
    async ({ draft: value }: Parameters<ContentRepository["saveDraft"]>[0]) =>
      ok({ ...value, editVersion: value.editVersion + 1 })
  )
  const repository = aContentRepository({
    createCourse,
    findCourse: async () => ({
      createdAt: now,
      id: draft.courseId,
      publishedCurriculumVersionId: null,
      sortOrder: 1,
      status: "active" as const,
    }),
    findDraft: async () => ok(draft),
    listActiveAssetsForCourse: async () => assets,
    publishDraft,
    readActiveAssetsByIds: async (assetIds) =>
      assets.filter((asset) => assetIds.includes(asset.id)),
    readCourseEditor: async () => toEditorDocument(draft),
    saveDraft,
  })
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
    createCourse,
    dependencies,
    publishDraft,
    saveDraft,
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
