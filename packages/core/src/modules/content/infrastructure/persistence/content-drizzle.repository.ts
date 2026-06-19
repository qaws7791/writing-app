import { and, asc, count, eq } from "drizzle-orm"
import { z } from "zod"
import type { ContentRepository } from "@workspace/core/modules/content/application/ports/content.repository"
import {
  courseDetailDtoSchema,
  courseSummaryDtoSchema,
  lessonDtoSchema,
  lessonStepDtoSchema,
  type CourseDetailDto,
  type CourseSummaryDto,
  type LessonDto,
  type LessonStepDto,
} from "@workspace/core/modules/content/domain/content.dto"
import { contentStatuses } from "@workspace/core/shared/kernel/status"

import type { WritingAppDatabase } from "@workspace/db/client"
import {
  courses,
  courseUnits,
  lessons,
  lessonSteps,
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
      id: courses.id,
      title: courses.title,
      description: courses.description,
      category: courses.category,
      visualKey: courses.visualKey,
      status: courses.status,
      lessonCount: count(lessons.id),
    })
    .from(courses)
    .leftJoin(
      lessons,
      and(eq(lessons.courseId, courses.id), eq(lessons.status, activeStatus))
    )
    .where(eq(courses.status, activeStatus))
    .groupBy(courses.id)
    .orderBy(asc(courses.sortOrder))
    .all()

  return rows.map((row) => courseSummaryDtoSchema.parse(row))
}

function findCourseDetail(
  db: WritingAppDatabase,
  courseId: string
): CourseDetailDto | null {
  const course = db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.status, activeStatus)))
    .get()

  if (course === undefined) {
    return null
  }

  const unitRows = db
    .select()
    .from(courseUnits)
    .where(
      and(
        eq(courseUnits.courseId, courseId),
        eq(courseUnits.status, activeStatus)
      )
    )
    .orderBy(asc(courseUnits.sortOrder))
    .all()
  const activeUnitIds = new Set(unitRows.map((unit) => unit.id))
  const lessonRows = db
    .select()
    .from(lessons)
    .where(
      and(eq(lessons.courseId, courseId), eq(lessons.status, activeStatus))
    )
    .orderBy(asc(lessons.sortOrder))
    .all()
    .filter((lesson) => activeUnitIds.has(lesson.unitId))

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
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.status, activeStatus)))
    .get()

  if (lesson === undefined) {
    return null
  }

  const course = db
    .select()
    .from(courses)
    .where(
      and(eq(courses.id, lesson.courseId), eq(courses.status, activeStatus))
    )
    .get()
  const unit = db
    .select()
    .from(courseUnits)
    .where(
      and(
        eq(courseUnits.id, lesson.unitId),
        eq(courseUnits.status, activeStatus)
      )
    )
    .get()

  if (course === undefined || unit === undefined) {
    return null
  }

  const steps = db
    .select()
    .from(lessonSteps)
    .where(
      and(
        eq(lessonSteps.lessonId, lessonId),
        eq(lessonSteps.status, activeStatus)
      )
    )
    .orderBy(asc(lessonSteps.sortOrder))
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

function toLessonStepDto(row: typeof lessonSteps.$inferSelect): LessonStepDto {
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
