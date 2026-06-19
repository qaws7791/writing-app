import { spawnSync } from "node:child_process"
import { createApp, createOpenApiDocument, type ApiDependencies } from "@/app"
import { resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const defaultOutputPath = new URL(
  "../../../../docs/engineering/contracts/writing-app-api-openapi.json",
  import.meta.url
)

const app = createApp(createOpenApiDependencies())
const outputPath = readOutputPath()

await Bun.write(
  outputPath,
  `${JSON.stringify(createOpenApiDocument(app), null, 2)}\n`
)
formatOutput(outputPath)

function readOutputPath(): URL {
  const outputPath = Bun.env.WRITING_APP_OPENAPI_OUTPUT_PATH

  if (outputPath === undefined || outputPath.length === 0) {
    return defaultOutputPath
  }

  return pathToFileURL(resolve(process.cwd(), outputPath))
}

function formatOutput(outputPath: URL) {
  const result = spawnSync("bun", ["oxfmt", fileURLToPath(outputPath)], {
    encoding: "utf8",
    stdio: "pipe",
  })

  if (result.status === 0) {
    return
  }

  throw new Error(
    [
      "OpenAPI 계약 파일 포맷에 실패했습니다.",
      result.stdout.trim(),
      result.stderr.trim(),
    ]
      .filter(Boolean)
      .join("\n")
  )
}

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
