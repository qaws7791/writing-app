import { describe, expect, it, vi } from "vitest"
import { err, ok } from "@workspace/kernel/result"
import type {
  AdminId,
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
} from "@workspace/types/ids"

import { createUploadContentAsset } from "#content/application/upload-content-asset"
import type {
  ContentAssetOwner,
  ContentApplicationDependencies,
  ContentAssetStoragePort,
  ContentRepository,
} from "#content/application/ports/content-ports"
import type { ContentAsset } from "#content/domain/content-asset"

const adminId = "admin-1" as AdminId
const courseId = "course-1" as CourseId
const curriculumVersionId = "curriculum:course-1:1" as CurriculumVersionId
const now = new Date("2026-07-24T00:00:00.000Z")
const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0x01])

describe("content asset upload application", () => {
  it("처리한 이미지를 저장한 뒤에만 active asset을 등록한다", async () => {
    const fixture = createFixture()
    const result = await fixture.upload(command())

    expect(result.isOk()).toBe(true)
    expect(fixture.storage.putObject).toHaveBeenCalledWith({
      body: jpegBytes,
      contentType: "image/jpeg",
      objectKey: "content-assets/course-cover/content-asset-1.jpg",
    })
    expect(fixture.assets).toHaveLength(1)
    expect(fixture.assets[0]).toMatchObject({
      altText: "코스 표지",
      byteSize: jpegBytes.byteLength,
      courseId,
      curriculumVersionId,
      status: "active",
    })
  })

  it("storage upload 실패 시 active asset row를 만들지 않는다", async () => {
    const fixture = createFixture({
      putObject: async () => err({ retryable: true }),
    })
    const result = await fixture.upload(command())

    expect(result).toEqual(
      err({
        compensation: "not-required",
        kind: "content-asset-storage-failed",
        operation: "upload",
        retryable: true,
      })
    )
    expect(fixture.assets).toHaveLength(0)
    expect(fixture.repository.createAsset).not.toHaveBeenCalled()
  })

  it("asset 등록 실패 시 object를 보상 삭제하고 active row를 남기지 않는다", async () => {
    const fixture = createFixture({
      createAsset: async () => err({ kind: "content-conflict" }),
    })
    const result = await fixture.upload(command())

    expect(result).toEqual(err({ kind: "content-conflict" }))
    expect(fixture.storage.deleteObjects).toHaveBeenCalledWith([
      "content-assets/course-cover/content-asset-1.jpg",
    ])
    expect(fixture.assets).toHaveLength(0)
  })

  it("decode 실패와 published version 대상 업로드를 storage 전에 거절한다", async () => {
    const decodeFailure = createFixture({
      process: async () => err({ reason: "image-decode-failed" }),
    })
    await expect(decodeFailure.upload(command())).resolves.toEqual(
      err({
        kind: "content-asset-invalid",
        reason: "image-decode-failed",
      })
    )
    expect(decodeFailure.storage.putObject).not.toHaveBeenCalled()

    const published = createFixture({
      owner: {
        courseId,
        curriculumVersionId,
        versionStatus: "published",
      },
    })
    await expect(published.upload(command())).resolves.toEqual(
      err({ kind: "content-immutable-revision" })
    )
    expect(published.storage.putObject).not.toHaveBeenCalled()
  })
})

function command() {
  return {
    adminId,
    altText: " 코스 표지 ",
    bytes: jpegBytes,
    courseId,
    curriculumVersionId,
    declaredContentType: "image/jpeg",
    kind: "course-cover" as const,
  }
}

function createFixture(
  overrides: {
    readonly createAsset?: ContentRepository["createAsset"]
    readonly owner?: ContentAssetOwner | null
    readonly process?: ContentApplicationDependencies["assetImageProcessor"]["process"]
    readonly putObject?: ContentAssetStoragePort["putObject"]
  } = {}
) {
  const assets: ContentAsset[] = []
  const owner =
    overrides.owner === undefined
      ? {
          courseId,
          curriculumVersionId,
          versionStatus: "draft" as const,
        }
      : overrides.owner
  const repository = {
    createAsset: vi.fn(
      overrides.createAsset ??
        (async (asset) => {
          assets.push(asset)
          return ok(asset)
        })
    ),
    createCourse: vi.fn(),
    findCourse: vi.fn(),
    findCurriculumByLesson: vi.fn(),
    findDraft: vi.fn(),
    deleteOrphanedAssetCandidates: vi.fn(),
    listPublishedCourseSummaries: vi.fn(),
    listActiveAssetsForCourse: vi.fn(async () => {
      throw new Error("upload는 editor asset 목록을 조회하지 않는다")
    }),
    listOrphanedAssetCandidates: vi.fn(),
    publishDraft: vi.fn(),
    readAssetOwner: vi.fn(async () => owner),
    readActiveAssetsByIds: vi.fn(async () => {
      throw new Error("upload는 참조 asset을 조회하지 않는다")
    }),
    readCourseEditor: vi.fn(),
    readCourses: vi.fn(),
    readCurriculum: vi.fn(),
    saveCourse: vi.fn(),
    saveDraft: vi.fn(),
  } satisfies ContentRepository
  const putObject: ContentAssetStoragePort["putObject"] =
    overrides.putObject ??
    (async () => ok({ url: "https://cdn.example.test/asset.jpg" }))
  const storage: ContentAssetStoragePort = {
    deleteObjects: vi.fn(async () => ok(undefined)),
    putObject: vi.fn(putObject),
    resolveUrl: vi.fn(() => {
      throw new Error("upload 결과 URL은 putObject 결과가 소유한다")
    }),
  }
  const dependencies = {
    assetIdGenerator: {
      next: () => "content-asset-1" as ContentAssetId,
    },
    assetImageProcessor: {
      process:
        overrides.process ??
        (async () =>
          ok({ bytes: jpegBytes, contentType: "image/jpeg" as const })),
    },
    assetStorage: storage,
    clock: { now: () => now },
    courseIdGenerator: { next: () => courseId },
    repository,
  } satisfies ContentApplicationDependencies

  return {
    assets,
    repository,
    storage,
    upload: createUploadContentAsset(dependencies),
  }
}
