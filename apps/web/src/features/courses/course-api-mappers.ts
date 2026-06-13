import type {
  CourseDetail,
  CourseSummary,
  ProgressCourseList,
} from "@/features/courses/course-types"
import type {
  ApiCourseDetailResponse,
  ApiCourseListResponse,
  ApiProgressResponse,
} from "@/lib/api/writing-app-api"

export function mapCourseList(
  response: ApiCourseListResponse
): readonly CourseSummary[] {
  return response.courses.map((course) => ({
    category: course.category,
    description: course.description,
    id: course.id,
    lessonCount: course.lessonCount,
    status: course.status,
    title: course.title,
  }))
}

export function mapCourseDetail(
  response: ApiCourseDetailResponse
): CourseDetail {
  return {
    category: response.category,
    description: response.description,
    id: response.id,
    lessonCount: response.lessonCount,
    progress: {
      completedLessons: response.progress.completedLessons,
      totalLessons: response.progress.totalLessons,
    },
    progressPercent: response.progress.percentage,
    status: response.status,
    title: response.title,
    units: response.units.map((unit) => ({
      id: unit.id,
      lessons: unit.lessons.map((lesson) => ({
        category: lesson.category,
        description: lesson.description,
        estimatedMinutes: lesson.estimatedMinutes,
        id: lesson.id,
        order: lesson.sortOrder,
        status: lesson.status,
        title: lesson.title,
      })),
      order: unit.sortOrder,
      title: unit.title,
    })),
  }
}

export function mapProgress(response: ApiProgressResponse): ProgressCourseList {
  return {
    courses: response.courses.map((course) => ({
      id: course.id,
      lessons: course.lessons.map((lesson) => ({
        estimatedMinutes: lesson.estimatedMinutes,
        id: lesson.id,
        status: lesson.status,
        title: lesson.title,
      })),
      nextLessons: course.nextLessons.map((lesson) => ({
        courseId: lesson.courseId,
        estimatedMinutes: lesson.estimatedMinutes,
        id: lesson.id,
        status: lesson.status,
        title: lesson.title,
      })),
      progressPercent: course.progressPercent,
      title: course.title,
    })),
    currentStreakDays: response.user.currentStreakDays,
  }
}
