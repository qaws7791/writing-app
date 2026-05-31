import { AI_FEEDBACK_SCORE_RANGE } from "@/features/lessons/lesson-generation-rules"
import { getMockAiFeedback } from "@/features/lessons/lesson-logic"

import { courseCategories } from "@/lib/api/fake/__fixtures__/course-data"
import { getCourseDetailById } from "@/lib/api/fake/__fixtures__/course-detail-data"
import { getLessonById } from "@/lib/api/fake/__fixtures__/lesson-data"
import { inProgressCourses } from "@/lib/api/fake/home-progress-fixtures"

export {
  AI_FEEDBACK_SCORE_RANGE,
  courseCategories,
  getCourseDetailById,
  getLessonById,
  getMockAiFeedback,
  inProgressCourses,
}
