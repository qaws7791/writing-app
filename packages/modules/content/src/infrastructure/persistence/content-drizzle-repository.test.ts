import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  contentAssetIdSchema,
  courseIdSchema,
  lessonIdSchema,
  lessonStepIdSchema,
  unitIdSchema,
} from "@workspace/contracts/content/ids"
import { adminIdSchema } from "@workspace/contracts/identity/admin-ids"
import { adminMcpApprovalIdSchema } from "@workspace/contracts/operations/admin-mcp-approvals"
import { adminMcpExecutionIdSchema } from "@workspace/contracts/operations/admin-mcp-executions"
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
describe("MCP content changes", () => {
  const adminId = adminIdSchema.parse("admin-owner")
  const courseId = courseIdSchema.parse("mcp-course-1")
  const createApprovalId = adminMcpApprovalIdSchema.parse(
    "admin-mcp-approval-create-1"
  )
  const archiveApprovalId = adminMcpApprovalIdSchema.parse(
    "admin-mcp-approval-archive-1"
  )
  const createExecutionId = adminMcpExecutionIdSchema.parse(createApprovalId)
  const archiveExecutionId = adminMcpExecutionIdSchema.parse(archiveApprovalId)
  const automaticCreateExecutionId = adminMcpExecutionIdSchema.parse(
    "admin-mcp-execution-create-1"
  )
  const automaticSaveExecutionId = adminMcpExecutionIdSchema.parse(
    "admin-mcp-execution-save-1"
  )
  const automaticRestoreExecutionId = adminMcpExecutionIdSchema.parse(
    "admin-mcp-execution-restore-1"
  )
  const contentAssetId = contentAssetIdSchema.parse("content-asset-1")
  const unitId = unitIdSchema.parse("unit-1")
  const lessonId = lessonIdSchema.parse("lesson-1")
  const firstStepId = lessonStepIdSchema.parse("step-1")
  const secondStepId = lessonStepIdSchema.parse("step-2")
  const createDigest = "a".repeat(64)
  const archiveDigest = "b".repeat(64)

  let client: ReturnType<typeof createInMemoryWritingAppDatabase>

  beforeEach(() => {
    client = createInMemoryWritingAppDatabase()
    runCurrentTestMigration(client.sqlite)
  })

  afterEach(() => client.close())

  describe("approved MCP content changes", () => {
    it("persists the mutation and receipt atomically and replays one approval", async () => {
      const repository = createDrizzleContentRepository(client.db)
      const created = await repository.executeApprovedMcpChange({
        adminId,
        approvalId: createApprovalId,
        courseId,
        executionId: createExecutionId,
        inputDigest: createDigest,
        kind: "create-course",
        now: new Date("2026-08-10T00:00:00.000Z"),
        mcpCredentialId: "approved-mcp-credential",
        toolName: "admin_create_course_draft",
      })

      expect(created.isOk()).toBe(true)
      if (created.isErr()) return
      expect(created.value.replayed).toBe(false)
      expect((await repository.findCourse(courseId))?.status).toBe("active")

      const replayed = await repository.executeApprovedMcpChange({
        adminId,
        approvalId: createApprovalId,
        courseId,
        executionId: createExecutionId,
        inputDigest: createDigest,
        kind: "create-course",
        now: new Date("2026-08-10T00:00:01.000Z"),
        mcpCredentialId: "approved-mcp-credential",
        toolName: "admin_create_course_draft",
      })

      expect(replayed.isOk()).toBe(true)
      if (replayed.isErr()) return
      expect(replayed.value.replayed).toBe(true)
      expect(replayed.value.receipt.createdAt.toISOString()).toBe(
        "2026-08-10T00:00:00.000Z"
      )
    })

    it("does not write a receipt when the approved edit version is stale", async () => {
      const repository = createDrizzleContentRepository(client.db)
      const created = await repository.executeApprovedMcpChange({
        adminId,
        approvalId: createApprovalId,
        courseId,
        executionId: createExecutionId,
        inputDigest: createDigest,
        kind: "create-course",
        now: new Date("2026-08-10T00:00:00.000Z"),
        mcpCredentialId: "approved-mcp-credential",
        toolName: "admin_create_course_draft",
      })
      expect(created.isOk()).toBe(true)

      const archived = await repository.executeApprovedMcpChange({
        adminId,
        approvalId: archiveApprovalId,
        courseId,
        expectedEditVersion: 1,
        expectedStatus: "active",
        executionId: archiveExecutionId,
        inputDigest: archiveDigest,
        kind: "archive-course",
        now: new Date("2026-08-10T00:01:00.000Z"),
        mcpCredentialId: "approved-mcp-credential",
        toolName: "admin_archive_course",
      })

      expect(archived.isErr()).toBe(true)
      if (archived.isOk()) return
      expect(archived.error.kind).toBe("content-conflict")
      expect((await repository.findCourse(courseId))?.status).toBe("active")

      const receipt = await repository.readApprovedMcpChangeReceipt({
        adminId,
        approvalId: archiveApprovalId,
        executionId: archiveExecutionId,
        inputDigest: archiveDigest,
        mcpCredentialId: "approved-mcp-credential",
        toolName: "admin_archive_course",
      })
      expect(receipt.isOk()).toBe(true)
      if (receipt.isErr()) return
      expect(receipt.value).toBeNull()
    })
  })

  describe("automatic MCP content changes", () => {
    it("creates one course for one idempotency binding", async () => {
      const repository = createDrizzleContentRepository(client.db)
      const command = {
        adminId,
        courseId,
        executionId: automaticCreateExecutionId,
        idempotencyKey: "automatic-create-course-1",
        inputDigest: createDigest,
        kind: "create-course" as const,
        now: new Date("2026-08-10T00:00:00.000Z"),
        mcpCredentialId: "automatic-mcp-credential",
        toolName: "admin_create_course_draft" as const,
      }

      const created = await repository.executeAutomaticMcpChange(command)
      const replayed = await repository.executeAutomaticMcpChange({
        ...command,
        now: new Date("2026-08-10T00:00:01.000Z"),
      })
      const conflicted = await repository.executeAutomaticMcpChange({
        ...command,
        inputDigest: archiveDigest,
        now: new Date("2026-08-10T00:00:02.000Z"),
      })

      expect(created.isOk() && created.value.replayed).toBe(false)
      expect(replayed.isOk() && replayed.value.replayed).toBe(true)
      expect(conflicted.isErr() && conflicted.error.kind).toBe(
        "content-idempotency-conflict"
      )
      expect((await repository.findCourse(courseId))?.status).toBe("active")
    })

    it("saves one draft and replays without incrementing the edit version", async () => {
      const repository = createDrizzleContentRepository(client.db)
      const created = await repository.createCourse({
        courseId,
        now: new Date("2026-08-10T00:00:00.000Z"),
      })
      expect(created.isOk()).toBe(true)
      const draft = await repository.findDraft(courseId)
      expect(draft.isOk() && draft.value !== null).toBe(true)
      if (draft.isErr() || draft.value === null) return
      const command = {
        adminId,
        draft: { ...draft.value, title: "자동 저장 강의" },
        executionId: automaticSaveExecutionId,
        expectedEditVersion: 0,
        idempotencyKey: "automatic-save-course-1",
        inputDigest: archiveDigest,
        kind: "save-course-draft" as const,
        now: new Date("2026-08-10T00:01:00.000Z"),
        mcpCredentialId: "automatic-mcp-credential",
        toolName: "admin_save_course_draft" as const,
      }

      const saved = await repository.executeAutomaticMcpChange(command)
      const replayed = await repository.executeAutomaticMcpChange({
        ...command,
        now: new Date("2026-08-10T00:01:01.000Z"),
      })
      const editor = await repository.readCourseEditor(courseId)

      expect(saved.isOk() && saved.value.replayed).toBe(false)
      expect(replayed.isOk() && replayed.value.replayed).toBe(true)
      expect(editor).toMatchObject({
        editVersion: 1,
        title: "자동 저장 강의",
      })
    })

    it("rejects moving an existing image reference to another step", async () => {
      const repository = createDrizzleContentRepository(client.db)
      const created = await repository.createCourse({
        courseId,
        now: new Date("2026-08-10T00:00:00.000Z"),
      })
      expect(created.isOk()).toBe(true)
      const draft = await repository.findDraft(courseId)
      expect(draft.isOk() && draft.value !== null).toBe(true)
      if (draft.isErr() || draft.value === null) return

      const assetCreated = await repository.createAsset({
        altText: "설명 이미지",
        byteSize: 100,
        contentType: "image/png",
        courseId,
        createdAt: new Date("2026-08-10T00:00:01.000Z"),
        curriculumVersionId: draft.value.curriculumVersionId,
        id: contentAssetId,
        kind: "reading-illustration",
        objectKey: "content-assets/reading-illustration/content-asset-1.png",
        orphanedAt: null,
        status: "active",
        updatedAt: new Date("2026-08-10T00:00:01.000Z"),
      })
      expect(assetCreated.isOk()).toBe(true)

      const initialDraft = {
        ...draft.value,
        units: [
          {
            id: unitId,
            lessons: [
              {
                category: null,
                description: null,
                estimatedMinutes: 5,
                id: lessonId,
                sortOrder: 1,
                status: "active" as const,
                steps: [
                  {
                    contentJson: JSON.stringify({
                      illustrationAssetId: contentAssetId,
                      text: "첫 번째 글",
                    }),
                    id: firstStepId,
                    sortOrder: 1,
                    status: "active" as const,
                    type: "READING" as const,
                  },
                  {
                    contentJson: JSON.stringify({ text: "두 번째 글" }),
                    id: secondStepId,
                    sortOrder: 2,
                    status: "active" as const,
                    type: "READING" as const,
                  },
                ],
                summary: [],
                title: "레슨",
              },
            ],
            sortOrder: 1,
            status: "active" as const,
            title: "유닛",
          },
        ],
      }
      const saved = await repository.saveDraft({
        draft: initialDraft,
        expectedEditVersion: 0,
        now: new Date("2026-08-10T00:00:02.000Z"),
      })
      expect(saved.isOk()).toBe(true)
      if (saved.isErr()) return

      const [savedUnit] = saved.value.units
      const [savedLesson] = savedUnit?.lessons ?? []
      const [savedFirstStep, savedSecondStep] = savedLesson?.steps ?? []
      expect(savedUnit).toBeDefined()
      expect(savedLesson).toBeDefined()
      expect(savedFirstStep).toBeDefined()
      expect(savedSecondStep).toBeDefined()
      if (
        savedUnit === undefined ||
        savedLesson === undefined ||
        savedFirstStep === undefined ||
        savedSecondStep === undefined
      ) {
        return
      }
      const movedDraft = {
        ...saved.value,
        units: [
          {
            ...savedUnit,
            lessons: [
              {
                ...savedLesson,
                steps: [
                  {
                    ...savedFirstStep,
                    contentJson: JSON.stringify({ text: "첫 번째 글" }),
                  },
                  {
                    ...savedSecondStep,
                    contentJson: JSON.stringify({
                      illustrationAssetId: contentAssetId,
                      text: "두 번째 글",
                    }),
                  },
                ],
              },
            ],
          },
        ],
      }
      const moved = await repository.executeAutomaticMcpChange({
        adminId,
        draft: movedDraft,
        executionId: automaticSaveExecutionId,
        expectedEditVersion: 1,
        idempotencyKey: "automatic-move-image-reference-1",
        inputDigest: createDigest,
        kind: "save-course-draft",
        now: new Date("2026-08-10T00:00:03.000Z"),
        mcpCredentialId: "automatic-mcp-credential",
        toolName: "admin_save_course_draft",
      })

      expect(moved.isErr()).toBe(true)
      if (moved.isOk()) return
      expect(moved.error).toMatchObject({
        kind: "content-validation-failed",
        reason: "invalid-asset-reference",
      })
      expect((await repository.readCourseEditor(courseId))?.editVersion).toBe(1)
    })

    it("restores one archived course and replays the receipt", async () => {
      const repository = createDrizzleContentRepository(client.db)
      const created = await repository.createCourse({
        courseId,
        now: new Date("2026-08-10T00:00:00.000Z"),
      })
      expect(created.isOk()).toBe(true)
      const activeCourse = await repository.findCourse(courseId)
      expect(activeCourse).not.toBeNull()
      if (activeCourse === null) return
      const archived = await repository.saveCourse({
        course: { ...activeCourse, status: "archived" },
        expectedStatus: "active",
      })
      expect(archived.isOk()).toBe(true)
      const command = {
        adminId,
        courseId,
        executionId: automaticRestoreExecutionId,
        expectedEditVersion: 0,
        expectedStatus: "archived" as const,
        idempotencyKey: "automatic-restore-course-1",
        inputDigest: createDigest,
        kind: "restore-course" as const,
        now: new Date("2026-08-10T00:01:00.000Z"),
        mcpCredentialId: "automatic-mcp-credential",
        toolName: "admin_restore_course" as const,
      }

      const restored = await repository.executeAutomaticMcpChange(command)
      const replayed = await repository.executeAutomaticMcpChange({
        ...command,
        now: new Date("2026-08-10T00:01:01.000Z"),
      })

      expect(restored.isOk() && restored.value.replayed).toBe(false)
      expect(replayed.isOk() && replayed.value.replayed).toBe(true)
      expect((await repository.findCourse(courseId))?.status).toBe("active")
    })
  })
})
