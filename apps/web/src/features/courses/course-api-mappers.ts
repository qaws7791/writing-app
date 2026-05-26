import {
  courseId,
  type Course,
  type CourseCategory,
} from "@/features/courses/course-data"
import type {
  CourseChapter,
  CourseDetail,
  CourseLesson,
  CourseProgress,
} from "@/features/courses/course-detail-data"

interface CourseCategoryListDto {
  categories: readonly {
    id: string
    title: string
    courses: readonly CourseSummaryDto[]
  }[]
}

interface CourseSummaryDto {
  id: string
  title: string
  description: string
  lessonCount: number
  thumbnail: string
}

interface CourseDetailDto {
  id: string
  title: string
  description: string
  thumbnail: string
  lessonCount: number
  firstLessonId?: string
  chapters: readonly {
    id: string
    label: string
    title: string
    lessons: readonly {
      id: string
      lessonId: string
      title: string
      description: string
      order: number
    }[]
  }[]
}

interface CourseProgressDto {
  completedCount: number
  nextLessonId?: string
  progressPercent: number
  totalLessons: number
}

export function mapCourseCategoriesDto(
  dto: CourseCategoryListDto
): readonly CourseCategory[] {
  return dto.categories.map((category) => ({
    id: category.id,
    title: category.title,
    courses: category.courses.map(mapCourseSummaryDto),
  }))
}

export function mapCourseSearchDto(dto: {
  courses: readonly CourseSummaryDto[]
}): readonly Course[] {
  return dto.courses.map(mapCourseSummaryDto)
}

export function mapCourseDetailDto(dto: CourseDetailDto): CourseDetail {
  const chapters = dto.chapters.map(
    (chapter): CourseChapter => ({
      id: chapter.id as CourseChapter["id"],
      label: chapter.label,
      title: chapter.title,
      lessons: chapter.lessons.map(
        (lesson): CourseLesson => ({
          id: lesson.id as CourseLesson["id"],
          lessonId: lesson.lessonId as CourseLesson["lessonId"],
          title: lesson.title,
          description: lesson.description,
          completed: false,
        })
      ),
    })
  )
  const firstLesson = chapters.flatMap((chapter) =>
    chapter.lessons.map((lesson) => ({
      chapterLabel: chapter.label,
      lesson,
    }))
  )[0]

  if (!firstLesson) {
    throw new Error(`Course detail must include at least one lesson: ${dto.id}`)
  }

  return {
    id: courseId(dto.id),
    title: dto.title,
    description: dto.description,
    thumbnail: dto.thumbnail,
    progress: {
      completedLessons: 0,
      totalLessons: dto.lessonCount,
      percentage: 0,
    },
    nextLesson: {
      chapterLabel: firstLesson.chapterLabel,
      title: firstLesson.lesson.title,
      description: firstLesson.lesson.description,
      lessonId: firstLesson.lesson.lessonId,
    },
    chapters,
  }
}

export function mergeCourseProgress(
  course: CourseDetail,
  progress: CourseProgressDto
): CourseDetail {
  let remainingCompleted = progress.completedCount
  const chapters = course.chapters.map((chapter) => ({
    ...chapter,
    lessons: chapter.lessons.map((lesson) => {
      const completed = remainingCompleted > 0
      if (completed) {
        remainingCompleted -= 1
      }

      return {
        ...lesson,
        completed,
      }
    }),
  }))
  const nextLessonSource =
    chapters
      .flatMap((chapter) =>
        chapter.lessons.map((lesson) => ({
          chapterLabel: chapter.label,
          lesson,
        }))
      )
      .find(({ lesson }) => lesson.lessonId === progress.nextLessonId) ??
    chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => ({
        chapterLabel: chapter.label,
        lesson,
      }))
    )[0]

  return {
    ...course,
    chapters,
    progress: mapCourseProgressDto(progress),
    nextLesson: nextLessonSource
      ? {
          chapterLabel: nextLessonSource.chapterLabel,
          title: nextLessonSource.lesson.title,
          description: nextLessonSource.lesson.description,
          lessonId: nextLessonSource.lesson.lessonId,
        }
      : course.nextLesson,
  }
}

function mapCourseSummaryDto(dto: CourseSummaryDto): Course {
  return {
    id: courseId(dto.id),
    title: dto.title,
    description: dto.description,
    lessonCount: dto.lessonCount,
    thumbnail: dto.thumbnail,
  }
}

function mapCourseProgressDto(dto: CourseProgressDto): CourseProgress {
  return {
    completedLessons: dto.completedCount,
    totalLessons: dto.totalLessons,
    percentage: dto.progressPercent,
  }
}
