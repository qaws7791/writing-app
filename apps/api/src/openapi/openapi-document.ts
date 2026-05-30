import type { OpenAPIV3_1 } from "openapi-types"

import type { AiFeedbackService } from "@workspace/core/ai-feedback"
import type { ContentService } from "@workspace/core/content"
import type { LearningService } from "@workspace/core/learning"

import type { CurrentAuthSession } from "@/auth/session"
import { createApiApp, type ApiLogger } from "@/app"

export type OpenApiDocument = OpenAPIV3_1.Document

const openApiGenerationError = new Error(
  "OpenAPI generation dependency should not be called."
)

const openApiLogger: ApiLogger = {
  error() {},
  info() {},
}

const openApiContentService: ContentService = {
  async getCourseDetail() {
    throw openApiGenerationError
  },
  async getLesson() {
    throw openApiGenerationError
  },
  async listCourseCategories() {
    throw openApiGenerationError
  },
}

const openApiLearningService: LearningService = {
  async completeLesson() {
    throw openApiGenerationError
  },
  async getCourseProgress() {
    throw openApiGenerationError
  },
  async getLessonProgress() {
    throw openApiGenerationError
  },
  async listProgress() {
    throw openApiGenerationError
  },
  async saveLessonAnswer() {
    throw openApiGenerationError
  },
  async saveLessonProgress() {
    throw openApiGenerationError
  },
}

const openApiAiFeedbackService: AiFeedbackService = {
  async createFeedback() {
    throw openApiGenerationError
  },
}

const noSessionAuth = {
  async getSession(): Promise<CurrentAuthSession | null> {
    return null
  },
  async handler() {
    throw openApiGenerationError
  },
}

export async function createOpenApiDocument(): Promise<OpenApiDocument> {
  const app = createApiApp({
    aiFeedbackService: openApiAiFeedbackService,
    auth: noSessionAuth,
    async checkDatabase() {
      throw openApiGenerationError
    },
    contentService: openApiContentService,
    learningService: openApiLearningService,
    logger: openApiLogger,
  })

  const response = await app.request("/openapi.json")
  if (!response.ok) {
    throw new Error(`OpenAPI document generation failed: ${response.status}`)
  }

  return (await response.json()) as OpenApiDocument
}
