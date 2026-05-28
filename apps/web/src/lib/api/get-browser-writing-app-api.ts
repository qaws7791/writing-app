"use client"

import { isBrowserFakeApiMode } from "@/lib/api/api-mode"
import { createHttpWritingAppApi } from "@/lib/api/http/create-http-writing-app-api"
import type { WritingAppApi } from "@/lib/api/writing-app-api"

export function getBrowserWritingAppApi(): WritingAppApi {
  if (isBrowserFakeApiMode()) {
    return createLazyFakeWritingAppApi()
  }

  return createHttpWritingAppApi({
    baseUrl: process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:4000",
  })
}

function createLazyFakeWritingAppApi(): WritingAppApi {
  let apiPromise: Promise<WritingAppApi> | undefined
  const getApi = () => {
    apiPromise ??= import("@/lib/api/fake/create-fake-writing-app-api").then(
      ({ createFakeWritingAppApi }) => createFakeWritingAppApi()
    )

    return apiPromise
  }

  return {
    async listCourseCategories() {
      return (await getApi()).listCourseCategories()
    },
    async searchCourses(query) {
      return (await getApi()).searchCourses(query)
    },
    async getCourseDetail(courseId) {
      return (await getApi()).getCourseDetail(courseId)
    },
    async getLesson(lessonId) {
      return (await getApi()).getLesson(lessonId)
    },
    async getCurrentUser() {
      return (await getApi()).getCurrentUser()
    },
    async getProfile() {
      return (await getApi()).getProfile()
    },
    async listProgress() {
      return (await getApi()).listProgress()
    },
    async getCourseProgress(courseId) {
      return (await getApi()).getCourseProgress(courseId)
    },
    async getCurriculumUpgrade(courseId) {
      return (await getApi()).getCurriculumUpgrade(courseId)
    },
    async applyCurriculumUpgrade(courseId) {
      return (await getApi()).applyCurriculumUpgrade(courseId)
    },
    async dismissCurriculumUpgrade(courseId) {
      return (await getApi()).dismissCurriculumUpgrade(courseId)
    },
    async getLessonProgress(lessonId) {
      return (await getApi()).getLessonProgress(lessonId)
    },
    async saveLessonProgress(lessonId, input) {
      return (await getApi()).saveLessonProgress(lessonId, input)
    },
    async saveLessonAnswer(lessonId, input) {
      return (await getApi()).saveLessonAnswer(lessonId, input)
    },
    async completeLesson(lessonId) {
      return (await getApi()).completeLesson(lessonId)
    },
    async createAiFeedback(input) {
      return (await getApi()).createAiFeedback(input)
    },
  }
}
