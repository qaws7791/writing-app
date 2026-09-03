import { and, asc, eq, inArray, isNotNull, lte } from "drizzle-orm"
import { err, ok, type Result } from "@workspace/kernel/result"
import type { WritingAppDatabase } from "@workspace/db/client"
import type {
  CourseId,
  ContentAssetId,
  CurriculumVersionId,
} from "@workspace/types/ids"

import type { ContentError } from "#content/domain/content-error"
import type { ContentAsset } from "#content/domain/content-asset"
import {
  createCourseId,
  readCurriculumVersionId,
} from "#content/domain/content-model"
import type { ContentAssetOwner } from "#content/application/ports/content-ports"
import {
  contentAssets,
  courseCurriculumVersions,
  courses,
} from "#content/infrastructure/persistence/schema"
import {
  activeStatus,
  isUniqueConstraintViolation,
  type CourseReadDatabase,
} from "#content/infrastructure/persistence/content-drizzle-shared"

export function listActiveAssetsForCourse(
  database: CourseReadDatabase,
  courseId: CourseId
): readonly ContentAsset[] {
  return database
    .select()
    .from(contentAssets)
    .where(
      and(
        eq(contentAssets.courseId, courseId),
        eq(contentAssets.status, "active")
      )
    )
    .orderBy(asc(contentAssets.createdAt), asc(contentAssets.id))
    .all()
    .map(toContentAsset)
}

export function listAssetsForCourse(
  database: CourseReadDatabase,
  courseId: CourseId
): readonly ContentAsset[] {
  return database
    .select()
    .from(contentAssets)
    .where(eq(contentAssets.courseId, courseId))
    .orderBy(asc(contentAssets.createdAt), asc(contentAssets.id))
    .all()
    .map(toContentAsset)
}

export function readActiveAssetsByIds(
  database: CourseReadDatabase,
  assetIds: readonly ContentAssetId[]
): readonly ContentAsset[] {
  if (assetIds.length === 0) return []

  return database
    .select()
    .from(contentAssets)
    .where(
      and(
        inArray(contentAssets.id, assetIds),
        eq(contentAssets.status, "active")
      )
    )
    .orderBy(asc(contentAssets.id))
    .all()
    .map(toContentAsset)
}

export function listOrphanedAssetCandidates(
  database: WritingAppDatabase,
  input: { readonly batchSize: number; readonly cutoff: Date }
) {
  try {
    return ok(
      database
        .select({
          id: contentAssets.id,
          objectKey: contentAssets.objectKey,
        })
        .from(contentAssets)
        .innerJoin(
          courseCurriculumVersions,
          eq(courseCurriculumVersions.id, contentAssets.curriculumVersionId)
        )
        .where(
          and(
            eq(contentAssets.status, "orphaned"),
            isNotNull(contentAssets.orphanedAt),
            lte(contentAssets.orphanedAt, input.cutoff),
            eq(courseCurriculumVersions.status, "draft")
          )
        )
        .orderBy(asc(contentAssets.orphanedAt), asc(contentAssets.id))
        .limit(input.batchSize)
        .all()
        .map(({ id, objectKey }) => ({ id: id as ContentAssetId, objectKey }))
    )
  } catch (cause) {
    return err({ cause, kind: "content-asset-persistence-failed" } as const)
  }
}

export function deleteOrphanedAssetCandidates(
  database: WritingAppDatabase,
  input: {
    readonly assetIds: readonly ContentAssetId[]
    readonly cutoff: Date
  }
) {
  if (input.assetIds.length === 0) return ok(0)

  try {
    const deleted = database
      .delete(contentAssets)
      .where(
        and(
          inArray(contentAssets.id, input.assetIds),
          eq(contentAssets.status, "orphaned"),
          isNotNull(contentAssets.orphanedAt),
          lte(contentAssets.orphanedAt, input.cutoff)
        )
      )
      .returning({ id: contentAssets.id })
      .all()
    return ok(deleted.length)
  } catch (cause) {
    return err({ cause, kind: "content-asset-persistence-failed" } as const)
  }
}

export function readAssetOwner(
  database: CourseReadDatabase,
  input: {
    readonly courseId: CourseId
    readonly curriculumVersionId: CurriculumVersionId
  }
): ContentAssetOwner | null {
  const owner = database
    .select({
      courseId: courseCurriculumVersions.courseId,
      curriculumVersionId: courseCurriculumVersions.id,
      versionStatus: courseCurriculumVersions.status,
    })
    .from(courseCurriculumVersions)
    .innerJoin(courses, eq(courses.id, courseCurriculumVersions.courseId))
    .where(
      and(
        eq(courses.id, input.courseId),
        eq(courses.status, activeStatus),
        eq(courseCurriculumVersions.id, input.curriculumVersionId)
      )
    )
    .get()

  return owner === undefined
    ? null
    : {
        courseId: createCourseId(owner.courseId),
        curriculumVersionId: readCurriculumVersionId(owner.curriculumVersionId),
        versionStatus: owner.versionStatus,
      }
}

export function createAsset(
  database: WritingAppDatabase,
  asset: ContentAsset
): Result<ContentAsset, ContentError> {
  try {
    return database.transaction((transaction) => {
      const owner = transaction
        .select({
          courseStatus: courses.status,
          versionStatus: courseCurriculumVersions.status,
        })
        .from(courseCurriculumVersions)
        .innerJoin(courses, eq(courses.id, courseCurriculumVersions.courseId))
        .where(
          and(
            eq(courses.id, asset.courseId),
            eq(courseCurriculumVersions.id, asset.curriculumVersionId)
          )
        )
        .get()

      if (owner === undefined || owner.courseStatus !== activeStatus) {
        return err({ kind: "content-not-found" })
      }
      if (owner.versionStatus !== "draft") {
        return err({ kind: "content-immutable-revision" })
      }

      transaction.insert(contentAssets).values(asset).run()
      return ok(asset)
    })
  } catch (cause) {
    if (isUniqueConstraintViolation(cause)) {
      return err({ cause, kind: "content-conflict" })
    }
    throw cause
  }
}

function toContentAsset(row: typeof contentAssets.$inferSelect): ContentAsset {
  return {
    ...row,
    courseId: createCourseId(row.courseId),
    curriculumVersionId: readCurriculumVersionId(row.curriculumVersionId),
    id: row.id as ContentAssetId,
    orphanedAt: row.orphanedAt === null ? null : new Date(row.orphanedAt),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}
