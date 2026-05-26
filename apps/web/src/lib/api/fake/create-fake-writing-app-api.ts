import { courseCategories } from "@/features/courses/course-data"
import {
  courseDetails,
  getCourseDetailById,
} from "@/features/courses/course-detail-data"
import { getLessonById } from "@/features/lessons/lesson-data"
import { getMockAiFeedback } from "@/features/lessons/lesson-logic"
import { apiFailure, apiOk } from "@/lib/api/api-result"
import type {
  LessonProgress,
  SaveLessonAnswerInput,
  WritingAppApi,
} from "@/lib/api/writing-app-api"

export function createFakeWritingAppApi(): WritingAppApi {
  const progressByLesson = new Map<string, LessonProgress>()
  const answersByLesson = new Map<string, SaveLessonAnswerInput[]>()

  return {
    async listCourseCategories() {
      return apiOk(courseCategories)
    },
    async searchCourses(query) {
      const normalizedQuery = query.trim()
      if (!normalizedQuery) {
        return apiFailure({
          code: "invalid-request",
          message: "Search query is required.",
        })
      }

      return apiOk(
        courseCategories.flatMap((category) =>
          category.courses.filter((course) =>
            `${course.title} ${course.description}`.includes(normalizedQuery)
          )
        )
      )
    },
    async getCourseDetail(courseId) {
      const course = getCourseDetailById(courseId)
      if (!course) {
        return apiFailure({
          code: "not-found",
          message: "Course was not found.",
        })
      }

      return apiOk(course)
    },
    async getLesson(lessonId) {
      const lesson = getLessonById(lessonId)
      if (!lesson) {
        return apiFailure({
          code: "not-found",
          message: "Lesson was not found.",
        })
      }

      return apiOk(lesson)
    },
    async getCurrentUser() {
      return apiOk({
        email: "learner@example.com",
        id: "fake-user",
        image: null,
        name: "학습자",
      })
    },
    async getProfile() {
      return apiOk({
        completedLessonCount: [...progressByLesson.values()].filter(
          (progress) => progress.status === "completed"
        ).length,
        courseCount: courseDetails.length,
      })
    },
    async getCourseProgress(courseId) {
      const course = getCourseDetailById(courseId)
      if (!course) {
        return apiFailure({
          code: "not-found",
          message: "Course was not found.",
        })
      }

      return apiOk(course.progress)
    },
    async getLessonProgress(lessonId) {
      const stored = progressByLesson.get(lessonId)
      if (stored) {
        return apiOk({
          ...stored,
          answers: answersByLesson.get(lessonId) ?? [],
        })
      }

      const lesson = getLessonById(lessonId)
      if (!lesson) {
        return apiFailure({
          code: "not-found",
          message: "Lesson was not found.",
        })
      }
      const firstStep = lesson.steps[0]

      return apiOk({
        answers: [],
        currentStepId: firstStep.id,
        lessonId,
        status: "not-started",
        stepOrder: firstStep.order,
      })
    },
    async saveLessonProgress(lessonId, input) {
      const current: LessonProgress = {
        answers: answersByLesson.get(lessonId) ?? [],
        currentStepId: input.currentStepId,
        lessonId,
        status: "in-progress",
        stepOrder: input.stepOrder,
      }
      progressByLesson.set(lessonId, current)

      return apiOk(current)
    },
    async saveLessonAnswer(lessonId, input) {
      const answers =
        answersByLesson
          .get(lessonId)
          ?.filter((answer) => answer.stepId !== input.stepId) ?? []
      answersByLesson.set(lessonId, [...answers, input])

      return apiOk({ saved: true })
    },
    async completeLesson(lessonId) {
      const lesson = getLessonById(lessonId)
      if (!lesson) {
        return apiFailure({
          code: "not-found",
          message: "Lesson was not found.",
        })
      }
      const finalStep = lesson.steps.at(-1)
      if (!finalStep) {
        return apiFailure({
          code: "contract-error",
          message: "Lesson does not include steps.",
        })
      }

      progressByLesson.set(lessonId, {
        answers: answersByLesson.get(lessonId) ?? [],
        currentStepId: finalStep.id,
        lessonId,
        status: "completed",
        stepOrder: finalStep.order,
      })

      return apiOk({
        completedAt: new Date(0).toISOString(),
        completedCount: [...progressByLesson.values()].filter(
          (progress) => progress.status === "completed"
        ).length,
        lessonId,
        status: "completed",
        wasAlreadyCompleted: false,
      })
    },
    async createAiFeedback(input) {
      const feedback = getMockAiFeedback()

      return apiOk({
        improvements: feedback.improve,
        nextAction: "개선 포인트 중 하나를 골라 다시 써보세요.",
        score: 82,
        scoreRange: [0, 100],
        strengths: feedback.good,
        summary: input.answer
          ? "작성 답변의 의도는 분명합니다."
          : "저장된 답변을 기준으로 피드백을 만들었습니다.",
      })
    },
  }
}
