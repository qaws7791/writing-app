import { describe, expect, it, vi } from "vitest"
import { err, ok } from "@workspace/kernel/result"
import type { ContentAssetId } from "@workspace/types/ids"

import { createCleanupOrphanedAssets } from "#content/application/cleanup-orphaned-content-assets"
import type { ContentRepository } from "#content/application/ports/content-ports"

const cutoff = new Date("2026-07-17T00:00:00.000Z")
const candidates = [
  {
    id: "content-asset-1" as ContentAssetId,
    objectKey: "content-assets/course-cover/content-asset-1.jpg",
  },
]

describe("orphan content asset cleanup", () => {
  it("dry-run은 storage와 DB를 변경하지 않고 대상 수를 보고한다", async () => {
    const fixture = createFixture()

    await expect(
      fixture.cleanup({ batchSize: 100, cutoff, dryRun: true })
    ).resolves.toEqual(ok({ deleted: 0, retained: 1, scanned: 1 }))
    expect(fixture.storage.deleteObjects).not.toHaveBeenCalled()
    expect(
      fixture.repository.deleteOrphanedAssetCandidates
    ).not.toHaveBeenCalled()
  })

  it("storage 삭제 뒤 조건부 DB 삭제를 수행한다", async () => {
    const fixture = createFixture()

    await expect(
      fixture.cleanup({ batchSize: 100, cutoff, dryRun: false })
    ).resolves.toEqual(ok({ deleted: 1, retained: 0, scanned: 1 }))
    expect(fixture.storage.deleteObjects).toHaveBeenCalledWith([
      candidates[0]?.objectKey,
    ])
    expect(
      fixture.repository.deleteOrphanedAssetCandidates
    ).toHaveBeenCalledWith({
      assetIds: [candidates[0]?.id],
      cutoff,
    })
  })

  it("storage 삭제 실패에는 DB row를 orphan 상태로 남긴다", async () => {
    const fixture = createFixture({ storageFailure: true })

    await expect(
      fixture.cleanup({ batchSize: 100, cutoff, dryRun: false })
    ).resolves.toEqual(
      err({
        compensation: "not-required",
        kind: "content-asset-storage-failed",
        operation: "cleanup-delete",
        retryable: true,
      })
    )
    expect(
      fixture.repository.deleteOrphanedAssetCandidates
    ).not.toHaveBeenCalled()
  })
})

function createFixture(input: Readonly<{ storageFailure?: boolean }> = {}) {
  const repository = {
    createAsset: vi.fn(),
    createCourse: vi.fn(),
    deleteOrphanedAssetCandidates: vi.fn(async () => ok(candidates.length)),
    findCourse: vi.fn(),
    findCurriculumByLesson: vi.fn(),
    findDraft: vi.fn(),
    listActiveAssetsForCourse: vi.fn(async () => {
      throw new Error("cleanup은 editor asset 목록을 조회하지 않는다")
    }),
    listOrphanedAssetCandidates: vi.fn(async () => ok(candidates)),
    listPublishedCourseSummaries: vi.fn(),
    publishDraft: vi.fn(),
    readAssetOwner: vi.fn(),
    readActiveAssetsByIds: vi.fn(async () => {
      throw new Error("cleanup은 참조 asset을 조회하지 않는다")
    }),
    readCourseEditor: vi.fn(),
    readCourses: vi.fn(),
    readCurriculum: vi.fn(),
    saveCourse: vi.fn(),
    saveDraft: vi.fn(),
  } satisfies ContentRepository
  const storage = {
    deleteObjects: vi.fn(async () =>
      input.storageFailure === true ? err({ retryable: true }) : ok(undefined)
    ),
    putObject: vi.fn(),
    resolveUrl: vi.fn(() => {
      throw new Error("cleanup은 public URL을 resolve하지 않는다")
    }),
  }
  const dependencies = {
    assetStorage: storage,
    repository,
  }

  return {
    cleanup: createCleanupOrphanedAssets(dependencies),
    repository,
    storage,
  }
}
