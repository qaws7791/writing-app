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
  for (const category of contentSeed.categories) {
    await db.insert(courseCategories).values(category).onConflictDoNothing()

    for (const course of category.courses) {
      await db
        .insert(courses)
        .values({
          id: course.id,
          categoryId: category.id,
          title: course.title,
          description: course.description,
          thumbnailPath: course.thumbnail,
          sortOrder: course.sortOrder,
        })
        .onConflictDoNothing()

      for (const chapter of course.chapters) {
        await db
          .insert(courseChapters)
          .values({
            id: chapter.id,
            courseId: course.id,
            label: chapter.label,
            title: chapter.title,
            sortOrder: chapter.sortOrder,
          })
          .onConflictDoNothing()

        for (const [index, lesson] of chapter.lessons.entries()) {
          const nextLesson = chapter.lessons[index + 1]

          await db
            .insert(courseLessons)
            .values({
              id: lesson.id,
              chapterId: chapter.id,
              lessonId: lesson.id,
              title: lesson.title,
              description: lesson.description,
              sortOrder: lesson.sortOrder,
            })
            .onConflictDoNothing()

          await db
            .insert(lessons)
            .values({
              id: lesson.id,
              categoryId: category.id,
              courseId: course.id,
              title: lesson.title,
              unitNumber: lesson.sortOrder,
              nextLessonId: nextLesson?.id,
            })
            .onConflictDoNothing()

          const steps = createSeedLessonSteps({
            categoryTitle: category.title,
            courseId: course.id,
            lessonDescription: lesson.description,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            nextLessonTitle: nextLesson?.title,
          })

          await db
            .insert(lessonSteps)
            .values(
              steps.map((step) => ({
                id: step.id,
                contentJson: JSON.stringify(step.content),
                lessonId: step.lessonId,
                points: step.points,
                required: step.required,
                sortOrder: step.sortOrder,
                type: step.type,
              }))
            )
            .onConflictDoNothing()
        }
      }
    }
  }
}
