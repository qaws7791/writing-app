import { AI_FEEDBACK_SCORE_RANGE } from "@/features/lessons/lesson-generation-rules"
import { getMockAiFeedback } from "@/features/lessons/lesson-logic"

import { courseCategories } from "@test/api/fixtures/course-data"
import { getCourseDetailById } from "@test/api/fixtures/course-detail-data"
import { getLessonById } from "@test/api/fixtures/lesson-data"
import { inProgressCourses } from "@test/api/fixtures/home-progress-fixtures"

export {
  AI_FEEDBACK_SCORE_RANGE,
  courseCategories,
  getCourseDetailById,
  getLessonById,
  getMockAiFeedback,
  inProgressCourses,
}
