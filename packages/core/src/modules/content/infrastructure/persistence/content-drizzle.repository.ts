import { and, asc, count, eq } from "drizzle-orm"
import { z } from "zod"

import type { ContentRepository } from "#core/modules/content/application/ports/content.repository"
import {
  courseDetailDtoSchema,
  courseSummaryDtoSchema,
  lessonDtoSchema,
  lessonStepDtoSchema,
  type CourseDetailDto,
  type CourseSummaryDto,
  type LessonDto,
  type LessonStepDto,
} from "#core/modules/content/domain/content.dto"
import { contentStatuses } from "#core/shared/kernel/status"

import type { WritingAppDatabase } from "@workspace/db/client"
import {
  courseCurriculumVersions,
  courses,
  courseUnitVersions,
  lessonStepVersions,
  lessonVersions,
} from "@workspace/db/schema"

const activeStatus = contentStatuses.active

const rawStepContentSchema = z.object({
  type: z.string(),
})

const lessonSummaryJsonSchema = z.array(z.string())

export function createDrizzleContentRepository(
  db: WritingAppDatabase
): ContentRepository {
  return {
    listCourses() {
      return Promise.resolve(listCourses(db))
    },
    findCourseDetail(courseId) {
      return Promise.resolve(findCourseDetail(db, courseId))
    },
    findLesson(lessonId) {
      return Promise.resolve(findLesson(db, lessonId))
    },
  }
}

function listCourses(db: WritingAppDatabase): readonly CourseSummaryDto[] {
  const rows = db
    .select({
      category: courseCurriculumVersions.category,
      description: courseCurriculumVersions.description,
      id: courses.id,
      lessonCount: count(lessonVersions.id),
      status: courses.status,
      title: courseCurriculumVersions.title,
      visualKey: courseCurriculumVersions.visualKey,
    })
    .from(courses)
    .innerJoin(
      courseCurriculumVersions,
      eq(courseCurriculumVersions.id, courses.publishedCurriculumVersionId)
    )
    .leftJoin(
      lessonVersions,
      and(
        eq(lessonVersions.curriculumVersionId, courseCurriculumVersions.id),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .where(eq(courses.status, activeStatus))
    .groupBy(courses.id, courseCurriculumVersions.id)
    .orderBy(asc(courses.sortOrder))
    .all()

  return rows.map((row) => courseSummaryDtoSchema.parse(row))
}

function findCourseDetail(
  db: WritingAppDatabase,
  courseId: string
): CourseDetailDto | null {
  const course = db
    .select({
      category: courseCurriculumVersions.category,
      curriculumVersionId: courseCurriculumVersions.id,
      description: courseCurriculumVersions.description,
      id: courses.id,
      status: courses.status,
      title: courseCurriculumVersions.title,
      visualKey: courseCurriculumVersions.visualKey,
    })
    .from(courses)
    .innerJoin(
      courseCurriculumVersions,
      eq(courseCurriculumVersions.id, courses.publishedCurriculumVersionId)
    )
    .where(and(eq(courses.id, courseId), eq(courses.status, activeStatus)))
    .get()

  if (course === undefined) return null

  const unitRows = db
    .select()
    .from(courseUnitVersions)
    .where(
      and(
        eq(courseUnitVersions.curriculumVersionId, course.curriculumVersionId),
        eq(courseUnitVersions.status, activeStatus)
      )
    )
    .orderBy(asc(courseUnitVersions.sortOrder))
    .all()
  const lessonRows = db
    .select()
    .from(lessonVersions)
    .where(
      and(
        eq(lessonVersions.curriculumVersionId, course.curriculumVersionId),
        eq(lessonVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonVersions.sortOrder))
    .all()

  return courseDetailDtoSchema.parse({
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    visualKey: course.visualKey,
    lessonCount: lessonRows.length,
    status: course.status,
    progress: {
      completedLessons: 0,
      lessons: lessonRows.map((lesson, index) => ({
        currentStepIndex: null,
        lessonId: lesson.id,
        status: index === 0 ? "available" : "locked",
      })),
      nextLesson:
        lessonRows[0] === undefined
          ? null
          : {
              currentStepIndex: null,
              estimatedMinutes: lessonRows[0].estimatedMinutes,
              id: lessonRows[0].id,
              status: "available",
              title: lessonRows[0].title,
            },
      totalLessons: lessonRows.length,
      percentage: 0,
    },
    units: unitRows.map((unit) => ({
      id: unit.id,
      title: unit.title,
      sortOrder: unit.sortOrder,
      lessons: lessonRows
        .filter((lesson) => lesson.unitId === unit.id)
        .map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          category: lesson.category,
          description: lesson.description,
          estimatedMinutes: lesson.estimatedMinutes,
          status: lesson.status,
          sortOrder: lesson.sortOrder,
        })),
    })),
  })
}

function findLesson(
  db: WritingAppDatabase,
  lessonId: string
): LessonDto | null {
  const lesson = db
    .select({
      category: lessonVersions.category,
      courseId: courses.id,
      curriculumVersionId: lessonVersions.curriculumVersionId,
      description: lessonVersions.description,
      estimatedMinutes: lessonVersions.estimatedMinutes,
      id: lessonVersions.id,
      summaryJson: lessonVersions.summaryJson,
      title: lessonVersions.title,
      unitId: lessonVersions.unitId,
    })
    .from(lessonVersions)
    .innerJoin(
      courses,
      eq(
        courses.publishedCurriculumVersionId,
        lessonVersions.curriculumVersionId
      )
    )
    .innerJoin(
      courseUnitVersions,
      and(
        eq(
          courseUnitVersions.curriculumVersionId,
          lessonVersions.curriculumVersionId
        ),
        eq(courseUnitVersions.id, lessonVersions.unitId)
      )
    )
    .where(
      and(
        eq(lessonVersions.id, lessonId),
        eq(lessonVersions.status, activeStatus),
        eq(courseUnitVersions.status, activeStatus),
        eq(courses.status, activeStatus)
      )
    )
    .get()

  if (lesson === undefined) return null

  const steps = db
    .select()
    .from(lessonStepVersions)
    .where(
      and(
        eq(lessonStepVersions.curriculumVersionId, lesson.curriculumVersionId),
        eq(lessonStepVersions.lessonId, lessonId),
        eq(lessonStepVersions.status, activeStatus)
      )
    )
    .orderBy(asc(lessonStepVersions.sortOrder))
    .all()
    .map(toLessonStepDto)

  return lessonDtoSchema.parse({
    id: lesson.id,
    courseId: lesson.courseId,
    unitId: lesson.unitId,
    title: lesson.title,
    category: lesson.category,
    description: lesson.description,
    estimatedMinutes: lesson.estimatedMinutes,
    summary: lessonSummaryJsonSchema.parse(JSON.parse(lesson.summaryJson)),
    steps,
  })
}

function toLessonStepDto(
  row: typeof lessonStepVersions.$inferSelect
): LessonStepDto {
  const parsedContent = rawStepContentSchema
    .passthrough()
    .parse(JSON.parse(row.contentJson))
  const { type: _storedSourceType, ...content } = parsedContent

  return lessonStepDtoSchema.parse({
    id: row.id,
    type: row.type,
    sortOrder: row.sortOrder,
    ...content,
  })
}
