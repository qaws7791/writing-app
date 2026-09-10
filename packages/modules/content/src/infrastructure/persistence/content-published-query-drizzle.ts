import { and, asc, eq, gt, or, sql } from "drizzle-orm"
import type {
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
  LessonId,
} from "@workspace/types/ids"

import {
  createCourseId,
  readCourseVisualKey,
  readCurriculumVersionId,
  readLessonId,
  type PublishedCourseSummary,
  type PublishedCourseSummaryQuery,
  type PublishedCurriculumRevision,
  type PublishedLessonReference,
} from "#content/domain/content-model"
import { readCurriculumUnits } from "#content/infrastructure/persistence/content-draft-publish-drizzle"
import {
  activeStatus,
  type CourseReadDatabase,
} from "#content/infrastructure/persistence/content-drizzle-shared"
import {
  courseCurriculumVersions,
  courses,
  lessonVersions,
} from "#content/infrastructure/persistence/schema"

export function listPublishedCourseSummaries(
  database: CourseReadDatabase,
  query?: PublishedCourseSummaryQuery
): readonly PublishedCourseSummary[] {
  const cursorCondition =
    query?.after === undefined
      ? undefined
      : or(
          gt(courses.sortOrder, query.after.sortOrder),
          and(
            eq(courses.sortOrder, query.after.sortOrder),
            gt(courses.id, query.after.courseId)
          )
        )
  const rows = database
    .select({
      category: courseCurriculumVersions.category,
      courseId: courses.id,
      coverAssetId: courseCurriculumVersions.coverAssetId,
      description: courseCurriculumVersions.description,
      lessonCount: sql<number>`(
        SELECT count(*)
        FROM ${lessonVersions}
        WHERE ${lessonVersions.curriculumVersionId} = ${courseCurriculumVersions.id}
          AND ${lessonVersions.status} = ${activeStatus}
      )`.mapWith(Number),
      revision: courseCurriculumVersions.revision,
      sortOrder: courses.sortOrder,
      title: courseCurriculumVersions.title,
      versionId: courseCurriculumVersions.id,
      visualKey: courseCurriculumVersions.visualKey,
    })
    .from(courses)
    .innerJoin(
      courseCurriculumVersions,
      eq(courseCurriculumVersions.id, courses.publishedCurriculumVersionId)
    )
    .where(
      and(
        eq(courses.status, activeStatus),
        eq(courseCurriculumVersions.status, "published"),
        query?.category === undefined
          ? undefined
          : eq(courseCurriculumVersions.category, query.category),
        cursorCondition
      )
    )
    .orderBy(asc(courses.sortOrder), asc(courses.id))
    .limit(query?.limit ?? -1)
    .all()

  return rows.map((row) => ({
    ...row,
    courseId: createCourseId(row.courseId),
    coverAssetId:
      row.coverAssetId === null ? null : (row.coverAssetId as ContentAssetId),
    versionId: readCurriculumVersionId(row.versionId),
    visualKey: readCourseVisualKey(row.visualKey),
  }))
}

export function readCurriculum(
  database: CourseReadDatabase,
  input: {
    readonly courseId: CourseId
    readonly curriculumVersionId?: CurriculumVersionId
  }
): PublishedCurriculumRevision | null {
  const course = database
    .select()
    .from(courses)
    .where(eq(courses.id, input.courseId))
    .get()
  if (course === undefined) return null
  if (
    input.curriculumVersionId === undefined &&
    course.status !== activeStatus
  ) {
    return null
  }

  const versionId =
    input.curriculumVersionId ?? course.publishedCurriculumVersionId
  if (versionId === null) return null
  const version = database
    .select()
    .from(courseCurriculumVersions)
    .where(
      and(
        eq(courseCurriculumVersions.id, versionId),
        eq(courseCurriculumVersions.courseId, input.courseId),
        eq(courseCurriculumVersions.status, "published")
      )
    )
    .get()
  if (version === undefined || version.publishedAt === null) return null

  return {
    category: version.category,
    courseId: createCourseId(version.courseId),
    coverAssetId:
      version.coverAssetId === null
        ? null
        : (version.coverAssetId as ContentAssetId),
    curriculumVersionId: readCurriculumVersionId(version.id),
    description: version.description,
    publishedAt: new Date(version.publishedAt),
    revision: version.revision,
    status: course.status,
    title: version.title,
    units: readCurriculumUnits(database, version.id),
    visualKey: readCourseVisualKey(version.visualKey),
  }
}

export function findCurriculumByLesson(
  database: CourseReadDatabase,
  input: {
    readonly curriculumVersionId?: CurriculumVersionId
    readonly lessonId: LessonId
  }
): PublishedLessonReference | null {
  const versionCondition =
    input.curriculumVersionId === undefined
      ? and(
          eq(courseCurriculumVersions.courseId, courses.id),
          eq(courseCurriculumVersions.id, courses.publishedCurriculumVersionId)
        )
      : and(
          eq(courseCurriculumVersions.courseId, courses.id),
          eq(courseCurriculumVersions.id, input.curriculumVersionId)
        )
  const row = database
    .select({
      courseId: courses.id,
      curriculumVersionId: courseCurriculumVersions.id,
      lessonId: lessonVersions.id,
      revision: courseCurriculumVersions.revision,
    })
    .from(courses)
    .innerJoin(courseCurriculumVersions, versionCondition)
    .innerJoin(
      lessonVersions,
      and(
        eq(lessonVersions.curriculumVersionId, courseCurriculumVersions.id),
        eq(lessonVersions.id, input.lessonId),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .where(
      and(
        eq(courseCurriculumVersions.status, "published"),
        input.curriculumVersionId === undefined
          ? eq(courses.status, activeStatus)
          : undefined
      )
    )
    .get()

  return row === undefined
    ? null
    : {
        courseId: createCourseId(row.courseId),
        curriculumVersionId: readCurriculumVersionId(row.curriculumVersionId),
        lessonId: readLessonId(row.lessonId),
        revision: row.revision,
      }
}
