import {
  executeBatch,
  requireBatchCondition,
  isBatchConflict,
} from "@workspace/db/batch"
import { and, asc, eq, inArray, isNotNull, lte, sql } from "drizzle-orm"
import { err, ok, type Result } from "@workspace/kernel/result"
import { chunkByBoundParameters } from "@workspace/db/bound-parameter-chunks"
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

export async function listActiveAssetsForCourse(
  database: CourseReadDatabase,
  courseId: CourseId
): Promise<readonly ContentAsset[]> {
  return (
    await database
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
  ).map(toContentAsset)
}

export async function listAssetsForCourse(
  database: CourseReadDatabase,
  courseId: CourseId
): Promise<readonly ContentAsset[]> {
  return (
    await database
      .select()
      .from(contentAssets)
      .where(eq(contentAssets.courseId, courseId))
      .orderBy(asc(contentAssets.createdAt), asc(contentAssets.id))
      .all()
  ).map(toContentAsset)
}

export async function readActiveAssetsByIds(
  database: CourseReadDatabase,
  assetIds: readonly ContentAssetId[]
): Promise<readonly ContentAsset[]> {
  if (assetIds.length === 0) return []

  const uniqueAssetIds = [...new Set(assetIds)]
  return (
    await Promise.all(
      chunkByBoundParameters(uniqueAssetIds, {
        fixedParameters: 1,
        parametersPerItem: 1,
      }).map(async (assetIdChunk) =>
        (
          await database
            .select()
            .from(contentAssets)
            .where(
              and(
                inArray(contentAssets.id, assetIdChunk),
                eq(contentAssets.status, "active")
              )
            )
            .all()
        ).map(toContentAsset)
      )
    )
  )
    .flat()
    .sort((left, right) =>
      left.id === right.id ? 0 : left.id < right.id ? -1 : 1
    )
}

export async function listOrphanedAssetCandidates(
  database: WritingAppDatabase,
  input: { readonly batchSize: number; readonly cutoff: Date }
) {
  try {
    return ok(
      (
        await database
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
      ).map(({ id, objectKey }) => ({ id: id as ContentAssetId, objectKey }))
    )
  } catch (cause) {
    return err({ cause, kind: "content-asset-persistence-failed" } as const)
  }
}

export async function deleteOrphanedAssetCandidates(
  database: WritingAppDatabase,
  input: { readonly assetIds: readonly ContentAssetId[]; readonly cutoff: Date }
) {
  const queries = chunkByBoundParameters(input.assetIds, {
    fixedParameters: 2,
    parametersPerItem: 1,
  }).map((ids) =>
    database
      .delete(contentAssets)
      .where(
        and(
          inArray(contentAssets.id, ids),
          eq(contentAssets.status, "orphaned"),
          isNotNull(contentAssets.orphanedAt),
          lte(contentAssets.orphanedAt, input.cutoff)
        )
      )
      .returning({ id: contentAssets.id })
  )
  const [first, ...rest] = queries
  if (first === undefined) return ok(0)
  try {
    const results = await database.batch([first, ...rest])
    return ok(results.reduce((count, rows) => count + rows.length, 0))
  } catch (cause) {
    return err({ cause, kind: "content-asset-persistence-failed" } as const)
  }
}

export async function readAssetOwner(
  database: CourseReadDatabase,
  input: {
    readonly courseId: CourseId
    readonly curriculumVersionId: CurriculumVersionId
  }
): Promise<ContentAssetOwner | null> {
  const owner = await database
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

export async function createAsset(
  database: WritingAppDatabase,
  asset: ContentAsset
): Promise<Result<ContentAsset, ContentError>> {
  try {
    const owner = await database
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

    await executeBatch(database, [
      requireBatchCondition(
        database,
        sql`EXISTS (SELECT 1 FROM ${courseCurriculumVersions} INNER JOIN ${courses} ON ${courses.id} = ${courseCurriculumVersions.courseId} WHERE ${courseCurriculumVersions.id} = ${asset.curriculumVersionId} AND ${courses.status} = 'active' AND ${courseCurriculumVersions.status} = 'draft')`
      ),
      database.insert(contentAssets).values(asset),
    ])
    return ok(asset)
  } catch (cause) {
    if (isBatchConflict(cause) || isUniqueConstraintViolation(cause)) {
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
