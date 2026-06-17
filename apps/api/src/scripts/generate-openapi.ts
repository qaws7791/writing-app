import { createApp, createOpenApiDocument, type ApiDependencies } from "@/app"

const outputPath = new URL(
  "../../../../docs/openapi/writing-app-api.json",
  import.meta.url
)

const app = createApp(createOpenApiDependencies())

await Bun.write(
  outputPath,
  `${JSON.stringify(createOpenApiDocument(app), null, 2)}\n`
)

function createOpenApiDependencies(): ApiDependencies {
  return {
    aiFeedbackService: {
      async createFeedback() {
        return unavailable()
      },
    },
    contentService: {
      async getCourseDetail() {
        return unavailable()
      },
      async getLesson() {
        return unavailable()
      },
      async listCourses() {
        return unavailable()
      },
    },
    learningService: {
      async completeLesson() {
        return unavailable()
      },
      async saveLessonProgress() {
        return unavailable()
      },
      async saveStepAnswer() {
        return unavailable()
      },
    },
    profileReader: {
      async readProfileStats() {
        return unavailable()
      },
    },
    progressService: {
      async readProgress() {
        return unavailable()
      },
    },
    sessionResolver: {
      async resolveSession() {
        return unavailable()
      },
    },
  }
}

function unavailable(): never {
  throw new Error("OpenAPI 생성용 의존성은 실행되지 않아야 합니다.")
}
