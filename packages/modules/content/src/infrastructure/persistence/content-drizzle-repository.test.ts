import { eq, inArray } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { createWritingAppDatabase } from "@workspace/db/client"
import { runCurrentTestMigration } from "@workspace/db/test-support/application-migration"
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

const now = new Date("2026-07-22T03:00:00.000Z")
const courseId = createCourseId("content-course-1")

describe("content Drizzle repository", () => {
  it("course마다 draft 하나만 DB partial unique index로 허용한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      await fixture.repository.createCourse({ courseId, now })

      expect(() =>
        fixture.databaseClient.db
          .insert(courseCurriculumVersions)
          .values({
            category: "미분류",
            courseId,
            createdAt: now,
            description: "중복 draft",
            editVersion: 0,
            id: createCurriculumVersionId(courseId, 2),
            publishedAt: null,
            revision: 2,
            status: "draft",
            title: "중복 draft",
            updatedAt: now,
            visualKey: "basic-sentence-writing",
          })
          .run()
      ).toThrow(/UNIQUE constraint failed/u)
    } finally {
      fixture.databaseClient.close()
    }
  })

  it("optimistic conflict를 Result로 반환하고 이전 draft를 보존한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      await fixture.repository.createCourse({ courseId, now })
      const draft = await readDraftOrThrow(fixture.repository)
      const first = await fixture.repository.saveDraft({
        draft: completeDraft(draft),
        expectedEditVersion: 0,
        now,
      })
      const stale = await fixture.repository.saveDraft({
        draft: completeDraft(draft),
        expectedEditVersion: 0,
        now,
      })

      expect(first.isOk() && first.value.editVersion).toBe(1)
      expect(stale.isErr() && stale.error).toEqual({
        kind: "content-conflict",
      })
      expect((await readDraftOrThrow(fixture.repository)).editVersion).toBe(1)
    } finally {
      fixture.databaseClient.close()
    }
  })

  it("publish를 원자적으로 commit하고 published revision을 trigger로 불변화한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      await fixture.repository.createCourse({ courseId, now })
      const initial = await readDraftOrThrow(fixture.repository)
      const saved = await fixture.repository.saveDraft({
        draft: completeDraft(initial),
        expectedEditVersion: 0,
        now,
      })
      if (saved.isErr()) throw new Error(saved.error.kind)
      const decision = decidePublishCurriculum({
        draft: saved.value,
        now,
      })
      if (decision.isErr()) throw new Error(decision.error.kind)

      const published = await fixture.repository.publishDraft({
        expectedEditVersion: 1,
        nextDraftId: createCurriculumVersionId(courseId, 2),
        publishedRevision: decision.value,
      })

      expect(published.isOk() && published.value.revision).toBe(1)
      expect((await readDraftOrThrow(fixture.repository)).revision).toBe(2)
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
    } finally {
      fixture.databaseClient.close()
    }
  })

  it("asset의 course/version FK와 published revision 불변성을 DB에서 강제한다", async () => {
    const fixture = createRepositoryFixture()
    const otherCourseId = createCourseId("content-course-2")

    try {
      await fixture.repository.createCourse({ courseId, now })
      await fixture.repository.createCourse({ courseId: otherCourseId, now })
      const draft = await readDraftOrThrow(fixture.repository)
      const asset = createAsset(draft.curriculumVersionId)

      await expect(fixture.repository.createAsset(asset)).resolves.toEqual(
        expect.objectContaining({ value: asset })
      )
      expect(() =>
        fixture.databaseClient.db
          .insert(contentAssets)
          .values({
            ...asset,
            courseId: otherCourseId,
            id: "content-asset-invalid-owner" as ContentAssetId,
            objectKey: "content-assets/course-cover/invalid-owner.jpg",
          })
          .run()
      ).toThrow(/FOREIGN KEY constraint failed/u)

      const saved = await fixture.repository.saveDraft({
        draft: completeDraft(draft),
        expectedEditVersion: 0,
        now,
      })
      if (saved.isErr()) throw new Error(saved.error.kind)
      const decision = decidePublishCurriculum({ draft: saved.value, now })
      if (decision.isErr()) throw new Error(decision.error.kind)
      await fixture.repository.publishDraft({
        expectedEditVersion: 1,
        nextDraftId: createCurriculumVersionId(courseId, 2),
        publishedRevision: decision.value,
      })

      expect(() =>
        fixture.databaseClient.db
          .update(contentAssets)
          .set({ altText: "변경 금지" })
          .where(eq(contentAssets.id, asset.id))
          .run()
      ).toThrow(/published content asset is immutable/u)
      expect(() =>
        fixture.databaseClient.db
          .delete(contentAssets)
          .where(eq(contentAssets.id, asset.id))
          .run()
      ).toThrow(/published content asset is immutable/u)
      await expect(
        fixture.repository.createAsset({
          ...asset,
          id: "content-asset-published" as ContentAssetId,
          objectKey: "content-assets/course-cover/published.jpg",
        })
      ).resolves.toEqual(
        expect.objectContaining({
          error: { kind: "content-immutable-revision" },
        })
      )
    } finally {
      fixture.databaseClient.close()
    }
  })

  it("draft asset 참조 변경을 낙관적 저장과 같은 transaction에서 orphan·reactivate한다", async () => {
    const fixture = createRepositoryFixture()
    const removedAt = new Date("2026-07-23T03:00:00.000Z")
    const reactivatedAt = new Date("2026-07-29T03:00:00.000Z")
    const removedAgainAt = new Date("2026-07-30T03:00:00.000Z")
    const cleanupBoundary = new Date("2026-08-06T03:00:00.000Z")

    try {
      await fixture.repository.createCourse({ courseId, now })
      const initial = completeDraft(await readDraftOrThrow(fixture.repository))
      const cover = createAsset(initial.curriculumVersionId)
      const illustration = {
        ...createAsset(initial.curriculumVersionId),
        id: "content-asset-illustration" as ContentAssetId,
        kind: "reading-illustration" as const,
        objectKey:
          "content-assets/reading-illustration/content-asset-illustration.jpg",
      }
      for (const asset of [cover, illustration]) {
        const created = await fixture.repository.createAsset(asset)
        if (created.isErr()) throw new Error(created.error.kind)
      }

      const referenced = withAssetReferences(initial, cover.id, illustration.id)
      const first = await fixture.repository.saveDraft({
        draft: referenced,
        expectedEditVersion: 0,
        now,
      })
      if (first.isErr()) throw new Error(first.error.kind)
      expect(first.value.coverAssetId).toBe(cover.id)
      expect(readAssetStates(fixture, [cover.id, illustration.id])).toEqual([
        { id: cover.id, orphanedAt: null, status: "active" },
        { id: illustration.id, orphanedAt: null, status: "active" },
      ])
      expect(() =>
        fixture.databaseClient.db
          .delete(contentAssets)
          .where(eq(contentAssets.id, cover.id))
          .run()
      ).toThrow(/FOREIGN KEY constraint failed/u)

      fixture.databaseClient.sqlite.exec(`
        CREATE TRIGGER force_content_conflict_after_asset_transition
        BEFORE UPDATE ON content_assets
        BEGIN
          UPDATE course_curriculum_versions
          SET edit_version = edit_version + 1
          WHERE id = NEW.curriculum_version_id;
        END;
      `)
      const raced = await fixture.repository.saveDraft({
        draft: withoutAssetReferences(first.value),
        expectedEditVersion: 1,
        now: removedAt,
      })
      expect(raced).toEqual(
        expect.objectContaining({ error: { kind: "content-conflict" } })
      )
      fixture.databaseClient.sqlite.exec(
        "DROP TRIGGER force_content_conflict_after_asset_transition"
      )
      expect((await readDraftOrThrow(fixture.repository)).editVersion).toBe(1)
      expect(readAssetStates(fixture, [cover.id, illustration.id])).toEqual([
        { id: cover.id, orphanedAt: null, status: "active" },
        { id: illustration.id, orphanedAt: null, status: "active" },
      ])

      const stale = await fixture.repository.saveDraft({
        draft: { ...initial, editVersion: 0 },
        expectedEditVersion: 0,
        now: removedAt,
      })
      expect(stale).toEqual(
        expect.objectContaining({ error: { kind: "content-conflict" } })
      )
      expect(readAssetStates(fixture, [cover.id, illustration.id])).toEqual([
        { id: cover.id, orphanedAt: null, status: "active" },
        { id: illustration.id, orphanedAt: null, status: "active" },
      ])

      const removed = await fixture.repository.saveDraft({
        draft: withoutAssetReferences(first.value),
        expectedEditVersion: 1,
        now: removedAt,
      })
      if (removed.isErr()) throw new Error(removed.error.kind)
      expect(readAssetStates(fixture, [cover.id, illustration.id])).toEqual([
        {
          id: cover.id,
          orphanedAt: removedAt.getTime(),
          status: "orphaned",
        },
        {
          id: illustration.id,
          orphanedAt: removedAt.getTime(),
          status: "orphaned",
        },
      ])

      const reactivated = await fixture.repository.saveDraft({
        draft: withAssetReferences(removed.value, cover.id, illustration.id),
        expectedEditVersion: 2,
        now: reactivatedAt,
      })
      if (reactivated.isErr()) throw new Error(reactivated.error.kind)
      expect(readAssetStates(fixture, [cover.id, illustration.id])).toEqual([
        { id: cover.id, orphanedAt: null, status: "active" },
        { id: illustration.id, orphanedAt: null, status: "active" },
      ])

      const removedAgain = await fixture.repository.saveDraft({
        draft: withoutAssetReferences(reactivated.value),
        expectedEditVersion: 3,
        now: removedAgainAt,
      })
      if (removedAgain.isErr()) throw new Error(removedAgain.error.kind)
      const cleanupCandidates =
        await fixture.repository.listOrphanedAssetCandidates({
          batchSize: 10,
          cutoff: removedAgainAt,
        })
      if (cleanupCandidates.isErr()) {
        throw new Error(cleanupCandidates.error.kind)
      }
      expect(cleanupCandidates.value.map(({ id }) => id)).toEqual([
        cover.id,
        illustration.id,
      ])
      await expect(
        fixture.repository.saveDraft({
          draft: withAssetReferences(
            removedAgain.value,
            cover.id,
            illustration.id
          ),
          expectedEditVersion: 4,
          now: cleanupBoundary,
        })
      ).resolves.toEqual(
        expect.objectContaining({
          error: {
            kind: "content-validation-failed",
            reason: "invalid-asset-reference",
          },
        })
      )
      expect((await readDraftOrThrow(fixture.repository)).editVersion).toBe(4)
      expect(readAssetStates(fixture, [cover.id, illustration.id])).toEqual([
        {
          id: cover.id,
          orphanedAt: removedAgainAt.getTime(),
          status: "orphaned",
        },
        {
          id: illustration.id,
          orphanedAt: removedAgainAt.getTime(),
          status: "orphaned",
        },
      ])
    } finally {
      fixture.databaseClient.close()
    }
  })

  it("asset kind·course를 검증하고 같은 course published asset의 다음 draft 재사용을 허용한다", async () => {
    const fixture = createRepositoryFixture()
    const otherCourseId = createCourseId("content-course-other")

    try {
      await fixture.repository.createCourse({ courseId, now })
      await fixture.repository.createCourse({ courseId: otherCourseId, now })
      const draft = completeDraft(await readDraftOrThrow(fixture.repository))
      const cover = createAsset(draft.curriculumVersionId)
      const wrongKind = {
        ...cover,
        id: "content-asset-wrong-kind" as ContentAssetId,
        kind: "reading-illustration" as const,
        objectKey:
          "content-assets/reading-illustration/content-asset-wrong-kind.jpg",
      }
      const otherDraft = await readDraftForCourseOrThrow(
        fixture.repository,
        otherCourseId
      )
      const otherCover = {
        ...createAsset(otherDraft.curriculumVersionId),
        courseId: otherCourseId,
        id: "content-asset-other-course" as ContentAssetId,
        objectKey: "content-assets/course-cover/content-asset-other-course.jpg",
      }
      for (const asset of [cover, wrongKind, otherCover]) {
        const created = await fixture.repository.createAsset(asset)
        if (created.isErr()) throw new Error(created.error.kind)
      }

      for (const invalidCoverId of [wrongKind.id, otherCover.id]) {
        await expect(
          fixture.repository.saveDraft({
            draft: { ...draft, coverAssetId: invalidCoverId },
            expectedEditVersion: 0,
            now,
          })
        ).resolves.toEqual(
          expect.objectContaining({
            error: {
              kind: "content-validation-failed",
              reason: "invalid-asset-reference",
            },
          })
        )
      }

      const saved = await fixture.repository.saveDraft({
        draft: { ...draft, coverAssetId: cover.id },
        expectedEditVersion: 0,
        now,
      })
      if (saved.isErr()) throw new Error(saved.error.kind)
      const decision = decidePublishCurriculum({ draft: saved.value, now })
      if (decision.isErr()) throw new Error(decision.error.kind)
      const published = await fixture.repository.publishDraft({
        expectedEditVersion: 1,
        nextDraftId: createCurriculumVersionId(courseId, 2),
        publishedRevision: decision.value,
      })
      if (published.isErr()) throw new Error(published.error.kind)

      const nextDraft = await readDraftOrThrow(fixture.repository)
      expect(nextDraft.coverAssetId).toBe(cover.id)
      const retained = await fixture.repository.saveDraft({
        draft: nextDraft,
        expectedEditVersion: 0,
        now: new Date(now.getTime() + 1),
      })
      expect(retained.isOk()).toBe(true)
      if (retained.isErr()) throw new Error(retained.error.kind)
      const removed = await fixture.repository.saveDraft({
        draft: { ...retained.value, coverAssetId: null },
        expectedEditVersion: 1,
        now: new Date(now.getTime() + 2),
      })
      expect(removed.isOk()).toBe(true)
      expect(readAssetStates(fixture, [cover.id])).toEqual([
        { id: cover.id, orphanedAt: null, status: "active" },
      ])
    } finally {
      fixture.databaseClient.close()
    }
  })

  it("7일 cutoff의 draft orphan만 정리하고 active·recent·published asset을 보존한다", async () => {
    const fixture = createRepositoryFixture()
    const publishedCourseId = createCourseId("content-course-published")
    const cutoff = new Date("2026-07-17T00:00:00.000Z")
    const beforeCutoff = new Date("2026-07-10T00:00:00.000Z")
    const afterCutoff = new Date(cutoff.getTime() + 1)

    try {
      await fixture.repository.createCourse({ courseId, now })
      const draft = await readDraftOrThrow(fixture.repository)
      const eligible = {
        ...createAsset(draft.curriculumVersionId),
        createdAt: beforeCutoff,
        id: "content-asset-eligible" as ContentAssetId,
        objectKey: "content-assets/course-cover/eligible.jpg",
        orphanedAt: cutoff,
        status: "orphaned" as const,
        updatedAt: cutoff,
      }
      const active = {
        ...createAsset(draft.curriculumVersionId),
        createdAt: beforeCutoff,
        id: "content-asset-active" as ContentAssetId,
        objectKey: "content-assets/course-cover/active.jpg",
        updatedAt: cutoff,
      }
      const recent = {
        ...eligible,
        id: "content-asset-recent" as ContentAssetId,
        objectKey: "content-assets/course-cover/recent.jpg",
        orphanedAt: afterCutoff,
        updatedAt: afterCutoff,
      }
      for (const asset of [eligible, active, recent]) {
        const created = await fixture.repository.createAsset(asset)
        if (created.isErr()) throw new Error(created.error.kind)
      }

      await fixture.repository.createCourse({
        courseId: publishedCourseId,
        now,
      })
      const publishedDraft = await readDraftForCourseOrThrow(
        fixture.repository,
        publishedCourseId
      )
      const publishedAsset = {
        ...eligible,
        courseId: publishedCourseId,
        curriculumVersionId: publishedDraft.curriculumVersionId,
        id: "content-asset-published-orphan" as ContentAssetId,
        objectKey: "content-assets/course-cover/published-orphan.jpg",
      }
      const createdPublishedAsset =
        await fixture.repository.createAsset(publishedAsset)
      if (createdPublishedAsset.isErr()) {
        throw new Error(createdPublishedAsset.error.kind)
      }
      const publishedDecision = decidePublishCurriculum({
        draft: completeDraft(publishedDraft),
        now,
      })
      if (publishedDecision.isErr()) {
        throw new Error(publishedDecision.error.kind)
      }
      const published = await fixture.repository.publishDraft({
        expectedEditVersion: publishedDraft.editVersion,
        nextDraftId: createCurriculumVersionId(publishedCourseId, 2),
        publishedRevision: publishedDecision.value,
      })
      if (published.isErr()) throw new Error(published.error.kind)

      await expect(
        fixture.repository.listOrphanedAssetCandidates({
          batchSize: 100,
          cutoff,
        })
      ).resolves.toEqual(
        expect.objectContaining({
          value: [
            {
              id: eligible.id,
              objectKey: eligible.objectKey,
            },
          ],
        })
      )
      await expect(
        fixture.repository.deleteOrphanedAssetCandidates({
          assetIds: [eligible.id],
          cutoff,
        })
      ).resolves.toEqual(expect.objectContaining({ value: 1 }))

      expect(
        fixture.databaseClient.db
          .select({ id: contentAssets.id })
          .from(contentAssets)
          .all()
          .map(({ id }) => id)
          .sort()
      ).toEqual([active.id, publishedAsset.id, recent.id].sort())
    } finally {
      fixture.databaseClient.close()
    }
  })

  it("publish transaction 실패 시 기존 draft 상태까지 rollback한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      await fixture.repository.createCourse({ courseId, now })
      const initial = await readDraftOrThrow(fixture.repository)
      const saved = await fixture.repository.saveDraft({
        draft: completeDraft(initial),
        expectedEditVersion: 0,
        now,
      })
      if (saved.isErr()) throw new Error(saved.error.kind)
      const decision = decidePublishCurriculum({
        draft: saved.value,
        now,
      })
      if (decision.isErr()) throw new Error(decision.error.kind)

      await expect(
        fixture.repository.publishDraft({
          expectedEditVersion: 1,
          nextDraftId: saved.value.curriculumVersionId,
          publishedRevision: decision.value,
        })
      ).rejects.toThrow(/UNIQUE constraint failed/u)

      const draft = await readDraftOrThrow(fixture.repository)
      expect(draft.curriculumVersionId).toBe(saved.value.curriculumVersionId)
      expect(
        fixture.databaseClient.db
          .select({ publishedAt: courseCurriculumVersions.publishedAt })
          .from(courseCurriculumVersions)
          .where(
            eq(courseCurriculumVersions.id, saved.value.curriculumVersionId)
          )
          .get()?.publishedAt
      ).toBeNull()
    } finally {
      fixture.databaseClient.close()
    }
  })

  it("archive가 새 조회만 숨기고 명시적으로 고정된 published revision은 보존한다", async () => {
    const fixture = createRepositoryFixture()

    try {
      await fixture.repository.createCourse({ courseId, now })
      const draft = await readDraftOrThrow(fixture.repository)
      const saved = await fixture.repository.saveDraft({
        draft: completeDraft(draft),
        expectedEditVersion: 0,
        now,
      })
      if (saved.isErr()) throw new Error(saved.error.kind)
      const decision = decidePublishCurriculum({
        draft: saved.value,
        now,
      })
      if (decision.isErr()) throw new Error(decision.error.kind)
      await fixture.repository.publishDraft({
        expectedEditVersion: 1,
        nextDraftId: createCurriculumVersionId(courseId, 2),
        publishedRevision: decision.value,
      })
      const course = await fixture.repository.findCourse(courseId)
      if (course === null) throw new Error("course not found")
      await fixture.repository.saveCourse({
        course: { ...course, status: "archived" },
        expectedStatus: "active",
      })

      expect(await fixture.repository.readCurriculum({ courseId })).toBeNull()
      expect(
        await fixture.repository.readCurriculum({
          courseId,
          curriculumVersionId: saved.value.curriculumVersionId,
        })
      ).toMatchObject({ revision: 1, title: saved.value.title })
    } finally {
      fixture.databaseClient.close()
    }
  })
})

function createRepositoryFixture() {
  const databaseClient = createWritingAppDatabase(":memory:")
  runCurrentTestMigration(databaseClient.sqlite)
  return {
    databaseClient,
    repository: createDrizzleContentRepository(databaseClient.db),
  }
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
  return readDraftForCourseOrThrow(repository, courseId)
}

async function readDraftForCourseOrThrow(
  repository: ReturnType<typeof createDrizzleContentRepository>,
  requestedCourseId: CurriculumDraft["courseId"]
): Promise<CurriculumDraft> {
  const draft = await repository.findDraft(requestedCourseId)
  if (draft.isErr()) throw new Error(draft.error.kind)
  if (draft.value === null) throw new Error("draft not found")
  return draft.value
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

function withAssetReferences(
  draft: CurriculumDraft,
  coverAssetId: ContentAssetId,
  illustrationAssetId: ContentAssetId
): CurriculumDraft {
  return {
    ...mapReadingContent(draft, (content) => ({
      ...content,
      illustrationAssetId,
    })),
    coverAssetId,
  }
}

function withoutAssetReferences(draft: CurriculumDraft): CurriculumDraft {
  return {
    ...mapReadingContent(draft, (content) =>
      Object.fromEntries(
        Object.entries(content).filter(([key]) => key !== "illustrationAssetId")
      )
    ),
    coverAssetId: null,
  }
}

function mapReadingContent(
  draft: CurriculumDraft,
  transform: (
    content: Readonly<Record<string, unknown>>
  ) => Readonly<Record<string, unknown>>
): CurriculumDraft {
  return {
    ...draft,
    units: draft.units.map((unit) => ({
      ...unit,
      lessons: unit.lessons.map((lesson) => ({
        ...lesson,
        steps: lesson.steps.map((step) =>
          step.type === "READING"
            ? {
                ...step,
                contentJson: JSON.stringify(
                  transform(
                    JSON.parse(step.contentJson) as Readonly<
                      Record<string, unknown>
                    >
                  )
                ),
              }
            : step
        ),
      })),
    })),
  }
}

function readAssetStates(
  fixture: ReturnType<typeof createRepositoryFixture>,
  assetIds: readonly ContentAssetId[]
): readonly Readonly<{
  id: ContentAssetId
  orphanedAt: number | null
  status: ContentAsset["status"]
}>[] {
  return fixture.databaseClient.db
    .select({
      id: contentAssets.id,
      orphanedAt: contentAssets.orphanedAt,
      status: contentAssets.status,
    })
    .from(contentAssets)
    .where(inArray(contentAssets.id, assetIds))
    .all()
    .map((asset) => ({
      ...asset,
      id: asset.id as ContentAssetId,
      orphanedAt: asset.orphanedAt?.getTime() ?? null,
    }))
    .sort((left, right) => left.id.localeCompare(right.id))
}
