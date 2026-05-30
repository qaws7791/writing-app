import type { WritingAppDatabase } from "@/client"
import {
  courseCategories,
  courseChapters,
  courseLessons,
  courses,
  curriculumVersionChapters,
  curriculumVersionLessons,
  curriculumVersionSteps,
  curriculumVersions,
  lessons,
  lessonSteps,
} from "@/schema"
import { contentSeed, createSeedLessonSteps } from "@/seeds/content-seed"

export async function seedContent(db: WritingAppDatabase) {
  const categoryRows: (typeof courseCategories.$inferInsert)[] = []
  const courseRows: (typeof courses.$inferInsert)[] = []
  const chapterRows: (typeof courseChapters.$inferInsert)[] = []
  const lessonRows: (typeof lessons.$inferInsert)[] = []
  const courseLessonRows: (typeof courseLessons.$inferInsert)[] = []
  const curriculumVersionRows: (typeof curriculumVersions.$inferInsert)[] = []
  const curriculumVersionChapterRows: (typeof curriculumVersionChapters.$inferInsert)[] =
    []
  const curriculumVersionLessonRows: (typeof curriculumVersionLessons.$inferInsert)[] =
    []
  const curriculumVersionStepRows: (typeof curriculumVersionSteps.$inferInsert)[] =
    []
  const lessonStepRows: (typeof lessonSteps.$inferInsert)[] = []
  const seedPublishedAt = new Date("2026-05-28T00:00:00.000Z")

  for (const category of contentSeed.categories) {
    categoryRows.push(category)

    for (const course of category.courses) {
      courseRows.push({
        id: course.id,
        categoryId: category.id,
        title: course.title,
        description: course.description,
        sortOrder: course.sortOrder,
      })

      const curriculumVersionId = `${course.id}-v1`

      curriculumVersionRows.push({
        id: curriculumVersionId,
        courseId: course.id,
        versionNumber: 1,
        status: "published",
        title: course.title,
        changelog: "초기 커리큘럼 버전",
        publishedAt: seedPublishedAt,
        createdAt: seedPublishedAt,
      })

      const courseLessonRefs = course.chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => ({
          chapter,
          lesson,
        }))
      )

      for (const chapter of course.chapters) {
        chapterRows.push({
          id: chapter.id,
          courseId: course.id,
          title: chapter.title,
          sortOrder: chapter.sortOrder,
        })

        curriculumVersionChapterRows.push({
          id: `${chapter.id}-v1`,
          curriculumVersionId,
          sourceChapterId: chapter.id,
          title: chapter.title,
          sortOrder: chapter.sortOrder,
          status: "active",
        })
      }

      for (const [index, { chapter, lesson }] of courseLessonRefs.entries()) {
        const nextLesson = courseLessonRefs[index + 1]?.lesson

        lessonRows.push({
          id: lesson.id,
          categoryId: category.id,
          courseId: course.id,
          title: lesson.title,
          unitNumber: chapter.sortOrder,
          nextLessonId: nextLesson?.id,
        })

        courseLessonRows.push({
          id: lesson.id,
          chapterId: chapter.id,
          lessonId: lesson.id,
          title: lesson.title,
          description: lesson.description,
          sortOrder: lesson.sortOrder,
        })

        curriculumVersionLessonRows.push({
          id: `${lesson.id}-v1`,
          curriculumVersionId,
          chapterId: `${chapter.id}-v1`,
          lessonId: lesson.id,
          title: lesson.title,
          description: lesson.description,
          sortOrder: lesson.sortOrder,
          status: "active",
        })

        const steps = createSeedLessonSteps({
          categoryTitle: category.title,
          courseId: course.id,
          lessonDescription: lesson.description,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          nextLessonTitle: nextLesson?.title,
        })

        lessonStepRows.push(
          ...steps.map((step) => ({
            id: step.id,
            contentJson: JSON.stringify(step.content),
            lessonId: step.lessonId,
            points: step.points,
            required: step.required,
            sortOrder: step.sortOrder,
            type: step.type,
          }))
        )
        curriculumVersionStepRows.push(
          ...steps.map((step) => ({
            id: `${step.id}-v1`,
            curriculumVersionId,
            lessonId: step.lessonId,
            sourceStepId: step.id,
            contentJson: JSON.stringify(step.content),
            points: step.points,
            required: step.required,
            sortOrder: step.sortOrder,
            status: "active" as const,
            type: step.type,
          }))
        )
      }
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(curriculumVersionSteps)
    await tx.delete(lessonSteps)
    await tx.delete(curriculumVersionLessons)
    await tx.delete(curriculumVersionChapters)
    await tx.delete(curriculumVersions)
    await tx.delete(courseLessons)
    await tx.delete(lessons)
    await tx.delete(courseChapters)
    await tx.delete(courses)
    await tx.delete(courseCategories)

    await tx.insert(courseCategories).values(categoryRows)
    await tx.insert(courses).values(courseRows)
    await tx.insert(courseChapters).values(chapterRows)
    await tx.insert(lessons).values(lessonRows)
    await tx.insert(courseLessons).values(courseLessonRows)
    await tx.insert(curriculumVersions).values(curriculumVersionRows)
    await tx
      .insert(curriculumVersionChapters)
      .values(curriculumVersionChapterRows)
    await tx
      .insert(curriculumVersionLessons)
      .values(curriculumVersionLessonRows)
    await tx.insert(lessonSteps).values(lessonStepRows)
    await tx.insert(curriculumVersionSteps).values(curriculumVersionStepRows)
  })
}
