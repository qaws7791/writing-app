import { aiFeedbackRoute } from "@/modules/ai-feedback/ai-feedback.routes"
import { authSessionRoute } from "@/modules/auth/auth.routes"
import {
  getCourseDetailRoute,
  listCoursesRoute,
} from "@/modules/courses/courses.routes"
import { healthRoute } from "@/modules/health/health.routes"
import { getLessonRoute } from "@/modules/lessons/lessons.routes"
import {
  completeLessonRoute,
  saveAnswerRoute,
} from "@/modules/learning/learning.routes"
import { profileRoute } from "@/modules/profile/profile.routes"
import { progressRoute } from "@/modules/progress/progress.routes"

export const routes = [
  healthRoute,
  authSessionRoute,
  profileRoute,
  listCoursesRoute,
  getCourseDetailRoute,
  getLessonRoute,
  progressRoute,
  saveAnswerRoute,
  completeLessonRoute,
  aiFeedbackRoute,
] as const
