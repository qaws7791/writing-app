import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, describe, expect, it } from "vitest"
import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import { createWritingAppDatabase } from "@workspace/db/client"
import { err } from "@workspace/kernel/result"

import { createApp } from "@/composition/create-app"
import { createContainer } from "@/composition/create-container"
import { parseApiEnv } from "@/config/env"

const unavailableAiFeedbackProvider: AiFeedbackProvider = {
  model: "test-unconfigured",
  provider: "test",
  async createFeedback() {
    return err({ kind: "provider-unavailable" })
  },
}

const temporaryDirectories: string[] = []

afterEach(async () => {
  for (const directory of temporaryDirectories.splice(0)) {
    await rm(directory, { force: true, recursive: true })
  }
})

describe("API container", () => {
  it("한 DB와 공통 runtime adapter로 learner·admin route를 조립하고 안전하게 종료한다", async () => {
    const directory = await mkdtemp(join(tmpdir(), "writing-app-p10-"))
    temporaryDirectories.push(directory)
    const databasePath = join(directory, "api.sqlite")
    const migrationDatabase = createWritingAppDatabase(databasePath)
    migrationDatabase.close()
    let sequence = 0
    const container = await createContainer(
      parseApiEnv(createTestEnvironment(databasePath)),
      {
        aiFeedbackProvider: unavailableAiFeedbackProvider,
        clock: { now: () => new Date("2026-07-23T00:00:00.000Z") },
        idGenerator: { next: () => `test-id-${++sequence}` },
      }
    )

    try {
      const app = createApp(container)
      const learnerHealth = await request(app.unified, "/api/health")
      const adminHealth = await request(app.unified, "/api/admin/health")
      const learnerOpenApi = await request(app.unified, "/api/openapi")
      const adminOpenApi = await request(app.unified, "/api/admin/openapi")

      expect(learnerHealth.status).toBe(200)
      expect(adminHealth.status).toBe(200)
      expect(learnerHealth.headers.get("x-request-id")).toBe("test-id-1")
      expect(adminHealth.headers.get("x-request-id")).toBe("test-id-2")
      expect((await learnerOpenApi.json()) as object).toHaveProperty(
        "paths./learning/lessons/{lessonId}/steps/{stepId}/complete.post"
      )
      expect((await adminOpenApi.json()) as object).toHaveProperty(
        "paths./api/admin/courses.get"
      )
    } finally {
      await container.dispose()
    }

    expect(container.health.isDatabaseReady()).toBe(false)
    await expect(container.dispose()).resolves.toBeUndefined()
  })
})

function createTestEnvironment(
  databasePath: string
): Record<string, string | undefined> {
  return {
    ADMIN_AUTH_SECRET: "admin-test-secret-0123456789abcdef",
    ADMIN_ORIGIN: "http://localhost:3001",
    API_PORT: "4000",
    DATABASE_URL: databasePath,
    LEARNER_AUTH_SECRET: "learner-test-secret-0123456789abcdef",
    LOG_LEVEL: "silent",
    NODE_ENV: "test",
    WEB_ORIGIN: "http://localhost:3000",
  }
}

function request(
  app: { fetch: (request: Request) => Promise<Response> | Response },
  path: string
): Promise<Response> | Response {
  return app.fetch(
    new Request(`http://localhost:4000${path}`, {
      headers: { Host: "localhost:4000" },
    })
  )
}
