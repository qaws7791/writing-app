import { apiFailure, apiOk } from "@/lib/api/api-result"
import {
  AI_FEEDBACK_SCORE_RANGE,
  courseCategories,
  getCourseDetailById,
  getLessonById,
  getMockAiFeedback,
  inProgressCourses,
} from "@test/api/fakes/fake-writing-app-fixtures"
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
    async getCourseDetail(courseId) {
      const course = getCourseDetailById(courseId)
      if (!course) {
        return apiFailure({
          code: "not-found",
          message: "코스를 찾을 수 없습니다.",
        })
      }

      return apiOk(course)
    },
    async getLesson(lessonId) {
      const lesson = getLessonById(lessonId)
      if (!lesson) {
        return apiFailure({
          code: "not-found",
          message: "레슨을 찾을 수 없습니다.",
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
    async listProgress() {
      return apiOk({
        courses: inProgressCourses.map((course) => ({
          completedLessons: course.completedLessons,
          courseDescription: course.description,
          courseId: course.id as never,
          courseTitle: course.title,
          lessons: course.lessons.map((lesson) => ({
            lessonId: lesson.id as never,
            status: lesson.status,
            title: lesson.name,
          })),
          nextLessonId: course.lessons.find(
            (lesson) => lesson.status === "next-up"
          )?.id as never,
          percentage: Math.round(course.progressPercent),
          totalLessons: course.totalLessons,
        })),
      })
    },
    async getCourseProgress(courseId) {
      const course = getCourseDetailById(courseId)
      if (!course) {
        return apiFailure({
          code: "not-found",
          message: "코스를 찾을 수 없습니다.",
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
          message: "레슨을 찾을 수 없습니다.",
        })
      }
      const firstStep = lesson.steps[0]
      if (!firstStep) {
        return apiFailure({
          code: "contract-error",
          message: "레슨에 스텝이 없습니다.",
        })
      }

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
          message: "레슨을 찾을 수 없습니다.",
        })
      }
      const finalStep = lesson.steps.at(-1)
      if (!finalStep) {
        return apiFailure({
          code: "contract-error",
          message: "레슨에 스텝이 없습니다.",
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
        scoreRange: AI_FEEDBACK_SCORE_RANGE,
        strengths: feedback.good,
        summary: input.answer
          ? "작성 답변의 의도는 분명합니다."
          : "저장된 답변을 기준으로 피드백을 만들었습니다.",
      })
    },
  }
}
