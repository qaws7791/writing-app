import type { WritingAppDatabase } from "@/client"
import {
  courseCategories,
  courseChapters,
  courseLessons,
  courses,
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
  const lessonStepRows: (typeof lessonSteps.$inferInsert)[] = []

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
            status: "active" as const,
            type: step.type,
          }))
        )
      }
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(lessonSteps)
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
    await tx.insert(lessonSteps).values(lessonStepRows)
  })
}
