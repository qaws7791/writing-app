import { describe, expect, it } from "vitest"

import {
  mapCourseCategoriesDto,
  mapCourseDetailDto,
  mergeCourseProgress,
} from "@/features/courses/course-api-mappers"

describe("course-api-mappers", () => {
  it("maps course categories from API DTOs", () => {
    const categories = mapCourseCategoriesDto({
      categories: [
        {
          id: "beginner",
          title: "입문",
          courses: [
            {
              id: "sentence-structure",
              title: "문장 구조",
              description: "문장 구조를 배웁니다.",
              lessonCount: 1,
            },
          ],
        },
      ],
    })

    expect(categories[0]?.courses[0]?.id).toBe("sentence-structure")
  })

  it("maps course detail and merges progress", () => {
    const course = mapCourseDetailDto({
      id: "sentence-structure",
      title: "문장 구조",
      description: "문장 구조를 배웁니다.",
      lessonCount: 1,
      firstLessonId: "sentence-structure-01",
      chapters: [
        {
          id: "chapter-1",
          title: "문장의 뼈대",
          lessons: [
            {
              id: "course-lesson-1",
              lessonId: "sentence-structure-01",
              title: "주어 찾기",
              description: "주어를 찾습니다.",
              order: 1,
            },
          ],
        },
      ],
    })

    const merged = mergeCourseProgress(course, {
      completedCount: 1,
      totalLessons: 1,
      progressPercent: 100,
      nextLessonId: undefined,
    })

    expect(merged.progress.percentage).toBe(100)
    expect(merged.chapters[0]?.lessons[0]?.completed).toBe(true)
  })
})
