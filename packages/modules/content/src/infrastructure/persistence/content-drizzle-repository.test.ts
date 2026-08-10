import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import type { WritingAppDatabaseClient } from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
import type { Result } from "@workspace/kernel/result"
import type { ContentAssetId } from "@workspace/types/ids"

import type { ContentAsset } from "#content/domain/content-asset"
import {
  createCourseId,
  createCurriculumVersionId,
  readLessonId,
  readLessonStepId,
  readUnitId,
  type CurriculumDraft,
} from "#content/domain/content-model"
import { decidePublishCurriculum } from "#content/domain/curriculum"
import { createDrizzleContentRepository } from "#content/infrastructure/persistence/content-drizzle-repository"
import {
  contentAssets,
  courseCurriculumVersions,
} from "#content/infrastructure/persistence/schema"

type ContentRepositoryFixture = Readonly<{
  databaseClient: WritingAppDatabaseClient
  repository: ReturnType<typeof createDrizzleContentRepository>
}>

const now = new Date("2026-07-22T03:00:00.000Z")
const removedAt = new Date("2026-07-23T03:00:00.000Z")
const courseId = createCourseId("content-course-1")

describe("content Drizzle repository", () => {
  it("draft를 발행하면 다음 draft를 만들고 발행 revision을 변경할 수 없다", async () => {
    await withContentRepository(async (fixture) => {
      await fixture.repository.createCourse({ courseId, now })
      const initial = await readDraftOrThrow(fixture.repository)
      const saved = unwrap(
        await fixture.repository.saveDraft({
          draft: completeDraft(initial),
          expectedEditVersion: 0,
          now,
        })
      )
      const publishedRevision = unwrap(
        decidePublishCurriculum({ draft: saved, now })
      )

      const published = unwrap(
        await fixture.repository.publishDraft({
          expectedEditVersion: 1,
          nextDraftId: createCurriculumVersionId(courseId, 2),
          publishedRevision,
        })
      )
      const nextDraft = await readDraftOrThrow(fixture.repository)

      expect({
        nextDraftRevision: nextDraft.revision,
        publishedRevision: published.revision,
      }).toEqual({ nextDraftRevision: 2, publishedRevision: 1 })
      expect(() =>
        fixture.databaseClient.db
          .update(courseCurriculumVersions)
          .set({ title: "변경 금지" })
          .where(
            eq(
              courseCurriculumVersions.id,
              createCurriculumVersionId(courseId, 1)
            )
          )
          .run()
      ).toThrow(/published curriculum version is immutable/u)
    })
  })

  it("publish transaction이 실패하면 발행 전 draft를 보존한다", async () => {
    await withContentRepository(async (fixture) => {
      await fixture.repository.createCourse({ courseId, now })
      const initial = await readDraftOrThrow(fixture.repository)
      const saved = unwrap(
        await fixture.repository.saveDraft({
          draft: completeDraft(initial),
          expectedEditVersion: 0,
          now,
        })
      )
      const publishedRevision = unwrap(
        decidePublishCurriculum({ draft: saved, now })
      )

      await expect(
        fixture.repository.publishDraft({
          expectedEditVersion: 1,
          nextDraftId: saved.curriculumVersionId,
          publishedRevision,
        })
      ).rejects.toThrow(/UNIQUE constraint failed/u)

      const preservedDraft = await readDraftOrThrow(fixture.repository)
      expect({
        curriculumVersionId: preservedDraft.curriculumVersionId,
        published: await fixture.repository.readCurriculum({ courseId }),
        revision: preservedDraft.revision,
      }).toEqual({
        curriculumVersionId: saved.curriculumVersionId,
        published: null,
        revision: 1,
      })
    })
  })

  it("asset 전이 중 edit version이 바뀌면 draft와 asset 전이를 함께 rollback한다", async () => {
    await withReferencedAsset(async ({ asset, fixture, referencedDraft }) => {
      fixture.databaseClient.sqlite.exec(`
        CREATE TRIGGER force_content_conflict_after_asset_transition
        BEFORE UPDATE ON content_assets
        BEGIN
          UPDATE course_curriculum_versions
          SET edit_version = edit_version + 1
          WHERE id = NEW.curriculum_version_id;
        END;
      `)

      let raced
      try {
        raced = await fixture.repository.saveDraft({
          draft: { ...referencedDraft, coverAssetId: null },
          expectedEditVersion: 1,
          now: removedAt,
        })
      } finally {
        fixture.databaseClient.sqlite.exec(
          "DROP TRIGGER force_content_conflict_after_asset_transition"
        )
      }

      expect({
        asset: readAssetState(fixture, asset.id),
        draftEditVersion: (await readDraftOrThrow(fixture.repository))
          .editVersion,
        error: raced.match(
          () => "unexpected-success",
          (error) => error.kind
        ),
      }).toEqual({
        asset: { orphanedAt: null, status: "active" },
        draftEditVersion: 1,
        error: "content-conflict",
      })
    })
  })
})

async function withContentRepository(
  run: (fixture: ContentRepositoryFixture) => Promise<void>
): Promise<void> {
  const databaseClient = createInMemoryWritingAppDatabase()
  try {
    runCurrentTestMigration(databaseClient.sqlite)
    await run({
      databaseClient,
      repository: createDrizzleContentRepository(databaseClient.db),
    })
  } finally {
    databaseClient.close()
  }
}

async function withReferencedAsset(
  run: (
    context: Readonly<{
      asset: ContentAsset
      fixture: ContentRepositoryFixture
      referencedDraft: CurriculumDraft
    }>
  ) => Promise<void>
): Promise<void> {
  await withContentRepository(async (fixture) => {
    await fixture.repository.createCourse({ courseId, now })
    const initial = completeDraft(await readDraftOrThrow(fixture.repository))
    const asset = createAsset(initial.curriculumVersionId)
    unwrap(await fixture.repository.createAsset(asset))
    const referencedDraft = unwrap(
      await fixture.repository.saveDraft({
        draft: { ...initial, coverAssetId: asset.id },
        expectedEditVersion: 0,
        now,
      })
    )

    await run({ asset, fixture, referencedDraft })
  })
}

function createAsset(
  curriculumVersionId: CurriculumDraft["curriculumVersionId"]
): ContentAsset {
  return {
    altText: "코스 표지",
    byteSize: 4,
    contentType: "image/jpeg",
    courseId,
    createdAt: now,
    curriculumVersionId,
    id: "content-asset-1" as ContentAssetId,
    kind: "course-cover",
    objectKey: "content-assets/course-cover/content-asset-1.jpg",
    orphanedAt: null,
    status: "active",
    updatedAt: now,
  }
}

async function readDraftOrThrow(
  repository: ReturnType<typeof createDrizzleContentRepository>
): Promise<CurriculumDraft> {
  const draft = unwrap(await repository.findDraft(courseId))
  if (draft === null) throw new Error("Content draft fixture was not found")
  return draft
}

function readAssetState(
  fixture: ContentRepositoryFixture,
  assetId: ContentAssetId
): Readonly<{ orphanedAt: number | null; status: ContentAsset["status"] }> {
  const asset = fixture.databaseClient.db
    .select({
      orphanedAt: contentAssets.orphanedAt,
      status: contentAssets.status,
    })
    .from(contentAssets)
    .where(eq(contentAssets.id, assetId))
    .get()
  if (asset === undefined)
    throw new Error("Content asset fixture was not found")
  return {
    orphanedAt: asset.orphanedAt?.getTime() ?? null,
    status: asset.status,
  }
}

function completeDraft(draft: CurriculumDraft): CurriculumDraft {
  return {
    ...draft,
    units: [
      {
        id: readUnitId("content-unit-1"),
        lessons: [
          {
            category: "기초",
            description: "설명",
            estimatedMinutes: 5,
            id: readLessonId("content-lesson-1"),
            sortOrder: 1,
            status: "active",
            steps: [
              {
                contentJson: JSON.stringify({
                  body: "본문",
                  guide: "",
                  title: "읽기",
                  type: "reading",
                }),
                id: readLessonStepId("content-step-1"),
                sortOrder: 1,
                status: "active",
                type: "READING",
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
  }
}

function unwrap<T, E>(result: Result<T, E>): T {
  return result.match(
    (value) => value,
    () => {
      throw new Error("Fixture operation failed")
    }
  )
}
